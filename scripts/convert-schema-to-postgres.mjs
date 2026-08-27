import fs from "node:fs";

const path = "drizzle/schema.ts";
let source = fs.readFileSync(path, "utf8");
source = source.replace(
  'import { foreignKey, index, int, mysqlEnum, mysqlTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/mysql-core";',
  'import { foreignKey, index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, varchar } from "drizzle-orm/pg-core";'
);
source = source.replaceAll("mysqlTable", "pgTable");
source = source.replaceAll("int(", "integer(");
source = source.replaceAll(".autoincrement()", ".generatedByDefaultAsIdentity()");
source = source.replaceAll(".onUpdateNow()", "");
const enumMappings = [
  ["userStatus", "userStatusEnum", "user_status", ["status"]],
  ["assetTypes", "assetTypeEnum", "asset_type", ["assetType"]],
  ["assetStatuses", "assetStatusEnum", "asset_status", ["status"]],
  ["environments", "environmentEnum", "environment", ["environment"]],
  ["monitoringTypes", "monitoringTypeEnum", "monitoring_type", ["type"]],
  ["monitoringStatuses", "monitoringStatusEnum", "monitoring_status", ["status"]],
  ["alertSeverities", "alertSeverityEnum", "alert_severity", ["severity"]],
  ["alertStatuses", "alertStatusEnum", "alert_status", ["status"]],
  ["incidentStatuses", "incidentStatusEnum", "incident_status", ["status", "fromStatus", "toStatus"]],
];
for (const [values, enumName, , columns] of enumMappings) {
  for (const column of columns) source = source.replaceAll(`mysqlEnum(\"${column}\", ${values})`, `${enumName}(\"${column}\")`);
}
const declarations = enumMappings.map(([values, enumName, typeName]) => `export const ${enumName} = pgEnum("${typeName}", ${values});`).join("\n");
source = source.replace("export const roles =", `${declarations}\n\nexport const roles =`);
fs.writeFileSync(path, source);
