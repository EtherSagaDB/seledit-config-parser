import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { argv } from "node:process";

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
	let fileArray = file.split("\\");
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
	let starterArray = configData.configText.split("\r\n");
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

		for (let i = 0; i < fieldNames.length; i++) {
			// I have no idea why I have this here but it was in the previous iteration for a reason.
			if (fieldNames[i] == fieldNames[i - 1]) {
				// console.log(fieldNames[i], fieldNames[i - 1]);
				continue;
			}

			let field = {
				name: fieldNames[i],
				type: "",
				length: 0,
			};

			field.name = fieldNames[i].replaceAll(" ", "");

			if (types[i].includes(":")) {
				let typeSplit = types[i].split(":");
				field.type = typeSplit[0];
				field.length = parseInt(typeSplit[1]);

				if (field.type === "wstring") {
					field.type = "string";
				}

				fields.push(field);
				continue;
			}

			switch (types[i]) {
				case "int32":
					field.length = 4;
					break;
				case "float":
					field.length = 4;
					break;
				case "double":
					field.length = 8;
					break;
			}

			field.type = types[i];
			fields.push(field);
		}

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

await main();
