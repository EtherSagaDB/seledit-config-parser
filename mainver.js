import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { argv } from "node:process";
import os from "node:os";

async function main() {
    const args = argv.slice(2);
    let config = await readConfig(args[0]);
    await parseConfig(config);
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

    let payload = {
        Game: "Ether Saga Odyssey",
        Version: "136",
        Definitions: {},
    };
    let position = 8;
    for (const defData of firstSweep) {
        let cleanedDefName = defData.name.split(" - ")[1].toString().replaceAll("_", "").replaceAll(" ", "");
        let secondaryPayload = {
            Order: parseInt(defData.name.split(" - ")[0].toString()),
        };
        payload.Definitions[cleanedDefName] = secondaryPayload;

        // this was to include offset but then I realized I cant do it this way
        let updateOffset = 0;
        for (const item of defData.fieldTypes.split(";")) {
            updateOffset += getType(item).length;
        }
        console.log(updateOffset);
    }
    console.log(payload);
    await writeFile("./out/Definitions.json", JSON.stringify(payload));
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
        default:
            console.log("Does not exist", type);
    }

    return newType;
}

await main();
