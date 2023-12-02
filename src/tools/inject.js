import fs from "fs-extra";

export const injectString = (string, vars={})=>{
    string = string == null ? "" : String(string);
    for (let key of (new Set(string.match(/(?<=\{\{)[^\{\}]+(?=\}\})/g)))) {
      string = string.replaceAll("{{"+key+"}}", vars[key] == null ? "" : vars[key]);
    }
    return string;
  }


export const injectFile = async (file, vars={})=>await fs.writeFile(file, injectString(await fs.readFile(file), vars));
