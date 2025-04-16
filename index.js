import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { argv } from "node:process";
import os from "node:os";

async function main() {
    const args = argv.slice(2);

    let configData = await readConfig(args[0]);
    let config = await parseConfig(configData);

    let individualDir = "";
    if (config.author == "Data") {
        individualDir = `/out/${config.game}/${config.ver}/${Date.now()}`;
    } else {
        individualDir = `/out/${config.game}/${config.ver}/${config.author}/`;
    }

    await createDir(individualDir);
    // write aio config
    await writeFile(path.join(process.cwd(), `/out/${config.game}_${config.ver}_${config.author}_AIO.json`), JSON.stringify(config));

    // write individual configs
    for (const list of config.definitions) {
        await writeFile(path.join(process.cwd(), individualDir, `${list.name}.json`), JSON.stringify(list));
    }
}

async function readConfig(file) {
    let configText = await readFile(file, { encoding: "utf-8" });

    let separator = "/";
    if (os.platform == "win32") {
        separator = "\\";
    }

    let fileArray = file.split(separator);
    fileArray = fileArray[fileArray.length - 1].replace(".cfg", "").split("_");
    let payload = {
        game: fileArray[0],
        ver: fileArray[1],
        author: fileArray[fileArray.length - 1],
        configText,
    };
    return payload;
}

async function parseConfig(configData) {
    let starterArray = configData.configText.split("\n"); // line ending changes?
    let totalTables = starterArray.shift();
    let baseIndex = starterArray.shift(); // not sure on this one chief

    let stringCleaning = starterArray.filter((v) => v != "");

    let setLength = stringCleaning.length / 4;
    let start = 0;
    let end = 4;

    let firstSweep = [];

    for (let i = 0; i < setLength; i++) {
        let elements = stringCleaning.slice(start, end);
        let name = elements[0],
            offset = elements[1],
            fields = elements[2],
            fieldTypes = elements[3];

        let listDef = {
            name: name,
            offset: offset,
            fields: fields,
            fieldTypes: fieldTypes,
        };

        firstSweep.push(listDef);
        start += 4;
        end += 4;
    }

    let secondSweep = [];

    for (const list of firstSweep) {
        let fieldNames = list.fields.split(";");
        let types = list.fieldTypes.split(";");

        let name = list.name.split(" - ")[1],
            id = list.name.split(" - ")[0],
            offset = parseInt(list.offset),
            fields = [];

        // catch duplicates
        let dupeData;
        if (list.name === "004 - Equipment" || list.name === "027 - Pet Badge") {
            dupeData = await dupeDetect(fieldNames, types);
			console.log(dupeData)

            for (const dupe of dupeData) {
                let field = {
                    name: "",
                    type: "",
                    length: 0,
                };

                if (Array.isArray(dupe)) {
					field.type = "fieldset";
					field.repeat = dupe[0].occurences;
					field.fields = [];
                    for (const entry of dupe) {
						let typeData = getType(entry.type);
						let payload = {
							name: entry.name,
							type: typeData.type,
							length: typeData.length
						}
						field.fields.push(payload);
                    }
					console.log(field);
                } else {
                    field.name = dupe.name;
                    let typeData = getType(dupe.type);
                    field.type = typeData.type;
                    field.length = typeData.length;
					console.log(field);
                }
				fields.push(field);
            }
        }

        // for (let i = 0; i < fieldNames.length; i++) {
        //     let field = {
        //         name: fieldNames[i],
        //         type: "",
        //         length: 0,
        //     };

        //     // if (list.name === "004 - Equipment" || list.name === "036 - Pet Production") {
        //     //     let ev = (el) => el.name == field.name;
        //     //     let dupeDataIndex = dupeData.findIndex(ev);

        //     //     if (dupeDataIndex > -1) {
        //     //         if (dupeData[dupeDataIndex].occurences > 1) {
        //     //             field.repeat = dupeData[dupeDataIndex].occurences;
        //     //         }
        //     //     } else {
        //     //         for (let q = 0; q < dupeData.length; q++) {
        //     //             if (Array.isArray(dupeData[q])) {
        //     //                 let subIndex = dupeData[q].findIndex(ev);
        //     //                 if (subIndex >= 0) {
        //     //                     console.log(dupeData[q][subIndex]);
        //     //                     field.repeat = dupeData[q][subIndex].occurences;
        //     //                     field.repeatData = dupeData[q][subIndex];
        //     //                 }
        //     //             }
        //     //         }
        //     //     }
        //     //     i += field.repeat - 1;
        //     // }
        //     // console.log(dupeData);
        //     // everything after this is broken

        //     field.name = fieldNames[i].replaceAll(" ", "");

        //     if (types[i].includes(":")) {
        //         let typeSplit = types[i].split(":");
        //         field.type = typeSplit[0];
        //         field.length = parseInt(typeSplit[1]);

        //         if (field.type === "wstring") {
        //             field.type = "string";
        //         }

        //         fields.push(field);
        //         continue;
        //     }

        //     switch (types[i]) {
        //         case "int32":
        //             types[i] = "Int32";
        //             field.length = 4;
        //             break;
        //         case "float":
        //             types[i] = "Single";
        //             field.length = 4;
        //             break;
        //         case "double":
        //             field.length = 8;
        //             break;
        //     }

        //     field.type = types[i];
        //     fields.push(field);
        // }

        secondSweep.push({
            name,
            id,
            offset,
            fields,
        });
    }

    delete configData.configText;
    configData.definitions = secondSweep;
    return configData;
}

async function createDir(folderPath) {
    try {
        await mkdir(path.join(process.cwd(), folderPath), { recursive: true });
        return;
    } catch (e) {
        return;
    }
}

async function dupeDetect(fieldNames, types) {
    let uniqueFields = [];
    let currentIndex = 0;
    for (const field of fieldNames) {
        const ev = (el) => el.name == field;
        let index = uniqueFields.findIndex(ev);

        if (index > -1) {
            uniqueFields[index].occurences++;
            if (uniqueFields[index].occurences == 2) {
                if (!uniqueFields[index].secondOccurence) {
                    uniqueFields[index].secondOccurence = currentIndex;
                }
            }
        } else {
            let fieldTemp = {
                name: field,
                occurences: 1,
                firstOccurence: currentIndex,
                type: types[currentIndex],
            };
            uniqueFields.push(fieldTemp);
            index = uniqueFields.length - 1;
        }
        currentIndex++;
    }
	console.log(uniqueFields);
    let finalUniqueFields = [];
    for (let i = 0; i < uniqueFields.length; i++) {
        let field = uniqueFields[i];
        let nextField = uniqueFields[i + 1];
        let prevField = uniqueFields[i - 1];

        if (field.secondOccurence) {
            // pattern
            let difference = field.secondOccurence - field.firstOccurence;
            if (difference >= 2) {
                let pattern = [];
                for (let z = 0; z < difference; z++) {
                    pattern.push(uniqueFields[i + z]);
                }
                i += difference - 1;
                finalUniqueFields.push(pattern);
                continue;
            } else {
                // consecutive
                field.repeat = true;
                finalUniqueFields.push(uniqueFields[i]);
                continue;
            }
        }
        finalUniqueFields.push(uniqueFields[i]);
    }
    return finalUniqueFields;
}

function getType(type) {
    let newType = {
        type: type,
        length: 0,
    };

    if (type.includes(":")) {
        let typeSplit = type.split(":");
        newType.type = typeSplit[0];
        newType.length = parseInt(typeSplit[1]);

        if (newType.type === "wstring") {
            newType.type = "string";
        }
        return newType;
    }

    switch (type) {
        case "int32":
            newType.type = "Int32";
            newType.length = 4;
            break;
        case "float":
            newType.type = "Single";
            newType.length = 4;
            break;
        case "double":
            newType.length = 8;
            break;
    }

    return newType;
}

await main();
