var fs = require("fs");
var t2j = new (require("./lib/tomlToJson.class"))();
var j2t = new (require("./lib/jsonToToml.class"))();

var jsonFolder = "./conv_json_out/";
var tomlInFolder = "./conv_toml_in/";
var tomlOutFolder = "./conv_toml_out/";
var tomlCompFolder = "./conv_toml_compare/";

var CT = require("./lib/const");

hackDiff = (toml_in, toml_out) => {
   var diffCount = 0, diffRes = [];
   let toml_in_arr = toml_in.split(CT.NL);
   let toml_out_arr = toml_out.split(CT.NL);
   toml_in_arr.forEach((tin,i)=>{
      if (toml_out_arr[i] != tin) {
         diffRes.push(tin);
         diffCount++;
      }
   });
   return { diffCount, diffRes };
}

clean = (s) => {
   let newlinesWitinSquareBrackets = new RegExp(CT.NL + "(?=[^\[]*\])", 'g');
   return s.toString().replaceAll(" ","").replaceAll("\t","").replaceAll("];","]").replace(newlinesWitinSquareBrackets,"").replace(CT.NL + CT.NL, CT.NL);
}


doTest = (fileName) => {

   let tomlFileInName = tomlInFolder + fileName;
   let tomlFileOutName = tomlOutFolder + fileName.replace(".toml",".out.toml");
   let tomlFileInCompareName = tomlCompFolder + fileName.replace(".toml",".in.compare.toml");
   let tomlFileOutCompareName = tomlCompFolder + fileName.replace(".toml",".out.compare.toml");
   let jsonFileOutName= jsonFolder + fileName.replace(".toml",".json");

	const toml_in = fs.readFileSync(tomlFileInName, {encoding:'utf8', flag:'r'}); 
	const json = t2j.renderJson(toml_in);
	const toml_out = j2t.renderToml(json);
   const toml_in_compare = clean(toml_in); 
   const toml_out_compare = clean(toml_out);

   console.log(fileName, hackDiff(toml_in_compare, toml_out_compare).diffCount);

	fs.writeFileSync(jsonFileOutName, JSON.stringify(json, undefined, 4));
   fs.writeFileSync(tomlFileOutName, toml_out);
   fs.writeFileSync(tomlFileInCompareName, toml_in_compare);
	fs.writeFileSync(tomlFileOutCompareName, toml_out_compare);
}

var fl = fs.readdirSync(tomlInFolder);

fl.forEach(f=>{
   doTest(f);
});

