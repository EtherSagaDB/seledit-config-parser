const fs = require("fs");

fs.readFile("./ESO_502_Data_Menno.cfg", { encoding: "utf-8" }, (err, data) => {
  let starterArray = data.split("\r\n");
  let metaRemovedArray = starterArray.slice(3, starterArray.length);
  let stringCleaning = metaRemovedArray.filter((v) => v != "");
  // console.log(stringCleaning);

  let setLength = stringCleaning.length / 4;
  let start = 0;
  let end = 4;

  let firstSweepData = [];

  for (let i = 0; i < setLength; i++) {
    let elements = stringCleaning.slice(start, end);
    let name = elements[0],
      offset = elements[1],
      fields = elements[2],
      fieldTypes = elements[3];

    let object = {
      name: name,
      offset: offset,
      fields: fields,
      fieldTypes,
      fieldTypes,
    };

    firstSweepData.push(object);
    start += 4;
    end += 4;
  }
  let secondSweepData = [];

  for (const list of firstSweepData) {
    let object = {};
    let fieldArray = [];
    let fields = list.fields.split(";");
    let fieldTypes = list.fieldTypes.split(";");

    for (let i = 0; i < fields.length; i++) {
      if (fields[i] == fields[i - 1]) {
        continue;
      }
      let field = {};
      field.name = fields[i].replaceAll(" ", "");
      field.type = fieldTypes[i];
      fieldArray.push(field);
    }

    let nameArray = list.name.split("-"),
      id = nameArray[0].trim(),
      name = nameArray[1].trim();

    object.name = name;
    object.id = id;
    object.offset = parseInt(list.offset);
    object.fields = fieldArray;
    secondSweepData.push(object);
  }
  // console.log(secondSweepData);
  // for (const data of secondSweepData) {
  //   if (data.name === "NPC_PROF_DEMOTION_SERVICE") {
  //     monsterSucks(data);
  //   }
  // }

  let writeData = JSON.stringify(secondSweepData);
  // console.log(writeData);

  fs.writeFile("./out/136-502.config.json", writeData, (err) => {
    if (err) {
      console.log(err);
    }
  });
  // createCSClasses(secondSweepData);
});

function createCSClasses(data) {
  for (const list of data) {
    let string = `public class ${list.name
      .replaceAll(" ", "")
      .replaceAll("_", "")}\n\{\n`;
    for (const field of list.fields) {
      switch (field.type) {
        case "int32":
          field.type = "Int32";
          break;
        case "wstring:512":
          field.type = "String";
          break;
        case "wstring:64":
          field.type = "String";
          break;
        case "wstring:32":
          field.type = "String";
          break;
        case "wstring:16":
          field.type = "String";
          break;
        case "wstring:8":
          field.type = "String";
          break;
        case "string:32":
          field.type = "String";
          break;
        case "double":
          field.type = "Double";
          break;
        case "float":
          field.type = "float";
          break;
        case "byte:96":
          field.type = "Byte[]";
          break;
        case "byte:6980":
          field.type = "Byte[]";
          break;
        case "byte:7808":
          field.type = "Byte[]";
          break;
        case "byte:43826":
          field.type = "Byte[]";
          break;
        default:
          console.log(field.type);
      }
      string += `	public ${field.type} ${field.name
        .replaceAll(" ", "")
        .replaceAll("%", "Percent")
        .replaceAll("?", "")} {get; set;}\n`;
    }
    string += `}`;

    fs.writeFile(
      `./old.definitions/${list.id} - ${list.name
        .replaceAll(" ", "")
        .replaceAll("_", "")}.cs`,
      string,
      (e) => {
        if (e) {
          console.log(e);
        }
      }
    );
  }
}

function monsterSucks(data) {
  // for (const field of data.fields) {
  for (let i = 0; i < data.fields.length; i++) {
    let field = data.fields[i];
    if (field.name == "Name") {
      console.log(field.type);
    }
    let string = "";
    switch (field.type) {
      case "int32":
        string += `data = reader.ReadBytes(4);\n${data.name
          .replaceAll(" ", "")
          .replaceAll("_", "")}.${field.name.replaceAll(
          " ",
          ""
        )} = BitConverter.ToInt32(data);\n\n`;
        break;
      case "Int32":
        string += `data = reader.ReadBytes(4);\n${data.name.replaceAll(
          " ",
          ""
        )}.${field.name.replaceAll(" ", "").replaceAll("_", "")} = BitConverter.ToInt32(data);\n\n`;
        break;
      case "wstring:512":
        string += `data = reader.ReadBytes(512);\n${data.name.replaceAll(
          " ",
          ""
        )}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "wstring:64":
        string += `data = reader.ReadBytes(64);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "wstring:32":
        string += `data = reader.ReadBytes(32);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "wstring:16":
        string += `data = reader.ReadBytes(16);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "wstring:8":
        string += `data = reader.ReadBytes(8);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "string:32":
        string += `data = reader.ReadBytes(32);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "String":
        string += `data = reader.ReadBytes(32);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(" ", "")} = Utils.StringParser(data);\n\n`;
        break;
      case "double":
        string += `data = reader.ReadBytes(8);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(
          " ",
          ""
        )} = BitConverter.ToDouble(data);\n\n`;
        break;
      case "float":
        string += `data = reader.ReadBytes(4);\n${data.name.replaceAll(
          " ",
          ""
        ).replaceAll("_", "")}.${field.name.replaceAll(
          " ",
          ""
        )} = BitConverter.ToSingle(data);\n\n`;
        break;
      // case "byte:96":
      //   field.type = "Byte[]";
      //   break;
      // case "byte:6980":
      //   field.type = "Byte[]";
      //   break;
      // case "byte:7808":
      //   field.type = "Byte[]";
      //   break;
      // case "byte:43826":
      //   field.type = "Byte[]";
      //   break;
      default:
        console.log("Monster:", field.type);
    }
    fs.appendFileSync(`./monsterFUCKdata.txt`, string, (e) => {
      if (e) {
        console.log(e);
      }
    });
  }

  let firstString = "";
  let secondString = "";
  // for (const field of data.fields) {
  for (let i = 0; i < data.fields.length; i++) {
    let field = data.fields[i];
    firstString += `${field.name.replaceAll(" ", "")},`;
    secondString += `{type.${field.name.replaceAll(" ", "")}},`;
  }

  let string = firstString + "\n" + secondString;

  fs.appendFileSync(`./monsterFUCK.txt`, string, (e) => {
    if (e) {
      console.log(e);
    }
  });
}
