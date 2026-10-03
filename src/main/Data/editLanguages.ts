import {promises as fs} from "fs";
import path from "path";
export default async function editLanguages(lan1: string, lan2: string)
{
    //File path to the language json
    const filePath : string = path.join(__dirname, "../../src/main/Data/languages.json");
    //console.log(filePath)
    try
    {
        
        const rawData = await fs.readFile(filePath, "utf8");
    
        const data = JSON.parse(rawData);
        

        data.lan1 = lan1
        data.lan2 = lan2;

        const updateJSON : string = JSON.stringify(data, null, 2);
        await fs.writeFile(filePath, updateJSON)

    }
    catch(error)
    {
        
        console.error("Failed to update");
    }
}