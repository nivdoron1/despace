import path from 'path';
import fs from 'fs-extra';
import { findWorkspaceRoot } from '../utils/workspace-detector';
import { AUTH_SCHEMA_TEMPLATE } from '../templates/AUTH_SCHEMA_TEMPLATE';
import { DB_SCHEMA_TEMPLATE } from '../templates/DB_SCHEMA_TEMPLATE';
import { PUBLIC_SCHEMA_INITIAL_TEMPLATE } from '../templates/PUBLIC_SCHEMA_INITIAL_TEMPLATE';




interface RelationshipInfo {
    targetTable: string;
    isArray: boolean; // true for one-to-many, false for many-to-one/one-to-one
    foreignKey: string; // The foreign key constraint name
    columns: string[]; // The local columns involved in the relation
}


interface ColumnInfo {
    name: string;
    type: string;
    isNullable: boolean;
}

interface TableMetadata {
    name: string;
    isView: boolean;
    columns: ColumnInfo[];
}

function extractRelationshipsFromTypes(typesFilePath: string): Record<string, RelationshipInfo[]> {
    try {
        const content = fs.readFileSync(typesFilePath, 'utf8');

        const relationships: Record<string, RelationshipInfo[]> = {};

        // Find the Tables block and extract relationships for each table
        const tablesStart = content.indexOf('Tables: {');
        if (tablesStart === -1) {
            console.warn('⚠️  Could not find Tables block for relationships');
            return {};
        }

        const tablesContent = content.slice(tablesStart);
        const lines = tablesContent.split('\n');

        let currentTable = '';
        let insideRelationships = false;
        let depth = 0;
        let insideRelationshipObject = false;
        let currentRelationship: Partial<RelationshipInfo & { foreignKeyName: string }> = {};

        for (const line of lines) {
            const trimmedLine = line.trim();

            // Check if we're entering a table definition
            const tableMatch = line.match(/^\s*([a-zA-Z0-9_]+):\s*{\s*$/);
            if (
                tableMatch &&
                !['Row', 'Insert', 'Update', 'Relationships'].includes(tableMatch[1])
            ) {
                currentTable = tableMatch[1];
                relationships[currentTable] = [];
                insideRelationships = false;
                depth = 1;
                continue;
            }

            if (!currentTable) continue;

            // Track depth for table structure
            const openBraces = (line.match(/{/g) || []).length;
            const closeBraces = (line.match(/}/g) || []).length;
            depth += openBraces - closeBraces;

            // Check if we're entering Relationships block
            if (trimmedLine === 'Relationships: [') {
                insideRelationships = true;
                continue;
            }

            if (insideRelationships) {
                // Check if we're starting a new relationship object
                if (trimmedLine === '{') {
                    insideRelationshipObject = true;
                    currentRelationship = {};
                    continue;
                }

                // Check if we're ending a relationship object
                if (trimmedLine === '}' || trimmedLine === '},') {
                    if (
                        insideRelationshipObject &&
                        currentRelationship.targetTable &&
                        currentRelationship.foreignKey
                    ) {
                        // Check for duplicates before adding
                        const exists = relationships[currentTable].some(
                            (rel) =>
                                rel.targetTable === currentRelationship.targetTable &&
                                rel.foreignKey === currentRelationship.foreignKey
                        );

                        if (!exists) {
                            relationships[currentTable].push({
                                targetTable: currentRelationship.targetTable!,
                                isArray: currentRelationship.isArray!,
                                foreignKey: currentRelationship.foreignKey!,
                                columns: currentRelationship.columns || [],
                            });
                        }

                    }
                    insideRelationshipObject = false;
                    currentRelationship = {};
                    continue;
                }

                if (insideRelationshipObject) {
                    // Extract foreignKeyName
                    const foreignKeyMatch = trimmedLine.match(
                        /foreignKeyName:\s*"([^"]+)"/
                    );
                    if (foreignKeyMatch) {
                        currentRelationship.foreignKey = foreignKeyMatch[1];
                    }

                    // Extract referencedRelation (this is the actual target table)
                    const referencedRelationMatch = trimmedLine.match(
                        /referencedRelation:\s*"([^"]+)"/
                    );
                    if (referencedRelationMatch) {
                        currentRelationship.targetTable = referencedRelationMatch[1];
                    }

                    // Extract isOneToOne
                    const isOneToOneMatch = trimmedLine.match(
                        /isOneToOne:\s*(true|false)/
                    );
                    if (isOneToOneMatch) {
                        currentRelationship.isArray = isOneToOneMatch[1] === 'false';
                    }

                    // Extract columns: ["user_id"]
                    const columnsMatch = trimmedLine.match(/columns:\s*\[([^\]]+)\]/);
                    if (columnsMatch) {
                        currentRelationship.columns = columnsMatch[1]
                            .split(',')
                            .map(c => c.trim().replace(/"/g, ''));
                    }

                }


                // Exit relationships block
                if (trimmedLine === ']') {
                    insideRelationships = false;
                }
            }

            // Exit table if depth returns to 0
            if (depth === 0) {
                currentTable = '';
            }
        }

        return relationships;
    } catch (err) {
        console.error('❌ Failed to extract relationships:', err);
        return {};
    }
}

// Util to write a file with content
function writeFile(folderPath: string, fileName: string, content: string) {
    const filePath = path.join(folderPath, fileName);
    if (fs.existsSync(filePath)) {
        console.log(`⏩ Skipped (already exists): ${filePath}`);
        return;
    }
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Created ${filePath}`);
}

// Capitalize helper
function capitalize(str: string) {
    return str
        .split('_')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

// camelCase helper
function camelCase(str: string) {
    const pascal = capitalize(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function extractTableMetadata(typesFilePath: string): TableMetadata[] {

    try {
        const content = fs.readFileSync(typesFilePath, 'utf8');
        const tables: TableMetadata[] = [];

        const extractFromBlock = (blockName: 'Tables' | 'Views') => {
            const blockStart = content.indexOf(`${blockName}: {`);
            if (blockStart === -1) return;

            let bracketCount = 0;
            let currentTable: TableMetadata | null = null;
            let insideRow = false;

            const lines = content.slice(blockStart).split('\n');
            for (const line of lines) {
                const trimmed = line.trim();

                // Track brackets to know when we exit blocks
                bracketCount += (line.match(/{/g) || []).length;
                bracketCount -= (line.match(/}/g) || []).length;

                // Match table name: "profiles: {"
                const tableMatch = line.match(/^\s*([a-zA-Z0-9_]+):\s*{\s*$/);
                if (tableMatch && bracketCount === 2) {
                    const name = tableMatch[1];
                    if (!['Row', 'Insert', 'Update', 'Relationships'].includes(name)) {
                        currentTable = { name, isView: blockName === 'Views', columns: [] };
                        tables.push(currentTable);
                    }
                }

                // Enter Row block
                if (trimmed === 'Row: {') {
                    insideRow = true;
                    continue;
                }

                // Exit Row block
                if (insideRow && trimmed.startsWith('}')) {
                    insideRow = false;
                    continue;
                }

                // Match column: "id: string" or "email: string | null"
                if (insideRow && currentTable) {
                    const colMatch = line.match(/^\s*([a-zA-Z0-9_]+):\s*([^,]+)$/);
                    if (colMatch) {
                        const name = colMatch[1];
                        const rawType = colMatch[2].trim();
                        currentTable.columns.push({
                            name,
                            type: rawType.replace(/\s*\|\s*null$/, ''),
                            isNullable: rawType.includes('null'),
                        });
                    }
                }

                if (bracketCount === 0) break;
            }
        };

        extractFromBlock('Tables');
        extractFromBlock('Views');
        return tables;
    } catch (err) {
        console.error('❌ Failed to extract table metadata:', err);
        return [];
    }
}

function generateDrizzleSchema(tables: TableMetadata[], relationships: Record<string, RelationshipInfo[]>): string {
    const imports = new Set<string>(['pgTable']);

    const schemaLines: string[] = [];

    schemaLines.push("import { users } from '../auth/schema';\n");

    for (const table of tables) {
        if (table.isView) continue; // Skip views for now or handle appropriately

        const tableName = table.name;
        const capName = capitalize(tableName);
        const rels = relationships[tableName] || [];

        schemaLines.push(`export const ${tableName} = pgTable('${tableName}', {`);

        for (const col of table.columns) {
            let line = `  ${camelCase(col.name)}: `;

            // Determine Drizzle type
            let drizzleType = 'text';
            const colType = col.type.toLowerCase();

            if (colType.includes('uuid')) {
                drizzleType = 'uuid';
            } else if (colType.includes('timestamp') || col.name.endsWith('_at')) {
                drizzleType = 'timestamp';
            } else if (colType.includes('boolean')) {
                drizzleType = 'boolean';
            } else if (colType.includes('integer') || colType.includes('int')) {
                drizzleType = 'integer';
            } else if (colType.includes('number') || colType.includes('numeric')) {
                drizzleType = 'numeric';
            } else if (colType.includes('json')) {
                drizzleType = 'jsonb';
            } else {
                drizzleType = 'text';
            }

            imports.add(drizzleType);
            line += `${drizzleType}('${col.name}')`;


            if (col.name === 'id') line += '.primaryKey()';
            if (!col.isNullable) line += '.notNull()';
            if (col.name.endsWith('_at')) line += '.defaultNow()';

            // Handle references
            const rel = rels.find(r => r.columns.includes(col.name));
            if (rel) {
                if (rel.targetTable === 'users') {
                    line += `.references(() => users.id, { onDelete: 'cascade' })`;
                } else if (tables.some(t => t.name === rel.targetTable)) {
                    line += `.references(() => ${rel.targetTable}.id, { onDelete: 'cascade' })`;
                }
            }


            schemaLines.push(line + ',');
        }

        schemaLines.push('});\n');
    }

    const importLine = `import { ${Array.from(imports).join(', ')} } from 'drizzle-orm/pg-core';\n`;
    return importLine + schemaLines.join('\n');
}

export async function generateSupabaseTypes(typesPathArg: string): Promise<void> {
    // 1. Resolve types file path
    const typesFilePath = path.isAbsolute(typesPathArg)
        ? typesPathArg
        : path.resolve(process.cwd(), typesPathArg);

    if (!fs.existsSync(typesFilePath)) {
        console.error(`❌ Error: Types file not found at ${typesFilePath}`);
        process.exit(1);
    }

    // 2. Get workspace name for imports
    const workspaceInfo = await findWorkspaceRoot();
    if (!workspaceInfo) {
        console.error('❌ Error: Could not determine workspace root. Are you in a despace workspace?');
        process.exit(1);
    }

    const outputBasePath = path.join(process.cwd(), 'src/lib/api');

    // 3. Extract metadata
    const tableMetadata = extractTableMetadata(typesFilePath);
    const relationships = extractRelationshipsFromTypes(typesFilePath);

    // 4. Templates
    function typesTemplate(table: TableMetadata) {
        const tableName = table.name;
        const isViews = table.isView;
        const cap = capitalize(tableName);
        const tableRelationships = relationships[tableName] || [];

        const relationshipTypes = tableRelationships
            .map((rel) => {
                const relationshipType = rel.isArray
                    ? `Tables<'${rel.targetTable}'>[]`
                    : `Tables<'${rel.targetTable}'> | null`;
                return `  ${rel.targetTable}?: ${relationshipType};`;
            })
            .join('\n');

        const hasRelationships = relationshipTypes.length > 0;

        if (isViews) {
            const baseType = `import type { Tables } from '../../../database.types';\n\nexport type ${cap} = Tables<'${tableName}'>`;
            return hasRelationships ? `${baseType} & {\n${relationshipTypes}\n};` : `${baseType};`;
        }

        const baseTypes = `import type { Tables, TablesInsert, TablesUpdate } from '../../../database.types';\n\nexport type ${cap} = Tables<'${tableName}'>`;
        const insertUpdateTypes = `export type ${cap}Insert = TablesInsert<'${tableName}'>;\nexport type ${cap}Update = TablesUpdate<'${tableName}'>;`;

        return hasRelationships ? `${baseTypes} & {\n${relationshipTypes}\n};\n\n${insertUpdateTypes}` : `${baseTypes};\n\n${insertUpdateTypes}`;
    }

    function serviceTemplate(tableName: string) {
        const serviceName = camelCase(tableName) + 'Service';
        return `import { SupabaseService } from '../../../database.service';
import { supabase } from '../../../client';

/**
 * A pre-configured service object for interacting
 * with the '${tableName}' table.
 *
 * This object contains all generic CRUD methods.
 * You can add custom, table-specific methods to this object.
 */
export const ${serviceName} = {
  ...SupabaseService(supabase, '${tableName}'),

  // --- Add custom methods below ---
  //
  // Example custom method:
  // async getActiveItems() {
  //   const { data, error } = await supabase
  //     .from('${tableName}')
  //     .select('*')
  //     .eq('is_active', true);
  //
  //   if (error) throw error;
  //   return data || [];
  // }
  //
  // --- End custom methods ---
};
`;
    }

    // 5. Generate files
    if (!fs.existsSync(outputBasePath)) {
        fs.mkdirSync(outputBasePath, { recursive: true });
    }

    for (const table of tableMetadata) {
        const tableName = table.name;
        const folderPath = path.join(outputBasePath, tableName);
        if (!fs.existsSync(folderPath)) {
            fs.mkdirSync(folderPath, { recursive: true });
        }

        writeFile(folderPath, `${tableName}.types.ts`, typesTemplate(table));
        writeFile(folderPath, 'service.ts', serviceTemplate(tableName));
    }

    // 6. Generate Drizzle Schema
    let drizzleSchema = generateDrizzleSchema(tableMetadata, relationships);

    // If no tables were found and we have no existing schema or it's just a placeholder, 
    // use the initial template as a starting point.
    if (tableMetadata.length === 0) {
        drizzleSchema = PUBLIC_SCHEMA_INITIAL_TEMPLATE;
    }

    const drizzleSchemaPath = path.join(process.cwd(), 'src/db/public/schema.ts');


    await fs.mkdirp(path.dirname(drizzleSchemaPath));
    await fs.writeFile(drizzleSchemaPath, drizzleSchema, 'utf8');
    console.log(`✅ Updated Drizzle schema at ${drizzleSchemaPath}`);

    // 7. Ensure Auth Schema exists
    const authSchemaPath = path.join(process.cwd(), 'src/db/auth/schema.ts');
    if (!(await fs.pathExists(authSchemaPath))) {
        await fs.mkdirp(path.dirname(authSchemaPath));
        await fs.writeFile(authSchemaPath, AUTH_SCHEMA_TEMPLATE, 'utf8');
        console.log(`✅ Created Auth schema at ${authSchemaPath}`);
    } else {
        console.log(`⏩ Skipped Auth schema (already exists): ${authSchemaPath}`);
    }

    // 8. Ensure combined schema exists
    const combinedSchemaPath = path.join(process.cwd(), 'src/db/schema.ts');
    if (!(await fs.pathExists(combinedSchemaPath))) {
        await fs.writeFile(combinedSchemaPath, DB_SCHEMA_TEMPLATE, 'utf8');
        console.log(`✅ Created combined schema at ${combinedSchemaPath}`);
    }


    console.log('🎉 Generation complete with relationships and Drizzle schema!');
}


