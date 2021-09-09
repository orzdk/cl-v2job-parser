var CT = require("./const");

class tomlToJson {

	blankLine = r => r!="";
	maptrim = m => m.trim();
	commentedLine = r => !r.startsWith("#") && !r.startsWith("//");
	textBetweenTripleQuotes = (a) => a.match(/"{3}([\s\S]*?"{3})/g);
	newlinesWitinSquareBrackets = () => new RegExp(CT.NL + "(?=[^\[]*\])", 'g');
    observationSource = () => new RegExp(/observationSource="{3}([\s\S]*?"{3})/,"g");
    anyNumberOfSpaces = () => new RegExp(/  +/,"g");
    oneSpace = () => new RegExp(/\s/,"g");
    jsonDataTag = () => new RegExp(/=<{([\s\S]*?}>)/,"g");
    jsonDataTagNeq = () => new RegExp(/<{([\s\S]*?}>)/,"g");

	charIndices = (findInStr, findStr) => {
		var indices = [];
		for(var i=0; i<findInStr.length;i++) {
		    if (findInStr[i] === findStr) indices.push(i);
		}
		return indices;
	}

	findKeyStart = (string, start) => {
		for (let i=start; i>-1; i--) {
			if (string.charAt(i) == " " || string.charAt(i) == CT.OBJECTSTART || string.charAt(i) == ","){
				return i + 1;
			}
		} 
		return 0;
	}

	findObjectEnd = (string, startAt, quoted) => {
		startAt = quoted ? startAt + 2 : startAt + 1;
		for (let i=startAt; i<string.length; i++){
			let theChar = string.charAt(i);
			if (quoted){
				if (theChar == CT.QUOTE){
					return i+1;
				}
			} else {
				if ([" ",CT.OBJECTEND].includes(theChar)){
					return i;
				}
			}
		} 
	}

	nameRefHack(task){
		if (task.includes("requestData=<{")){
			return "requestData";
		} else if (task.includes("txMeta=<{")){
			return "txMeta";
		} else if (task.includes("data=<{")){
			return "data";	
		} else {
			return "";
		}
	}

	renderJson = (toml) => {

		toml = toml.replace(this.newlinesWitinSquareBrackets(), "");
		toml = toml.replace(this.anyNumberOfSpaces(), " ");
		toml = toml.replaceAll("= ", "=").replaceAll(" =", "=").replaceAll("{ \"", "{\"").replaceAll("\" }", "\"}");

		var tasksArray = [];
		var obsSource = this.textBetweenTripleQuotes(toml);
		var config = toml.replace(this.observationSource(),"");

		let configArray = config.split(CT.NL)
		.map(this.maptrim)
		.filter(this.blankLine)
		.filter(this.commentedLine)
		.map(configKey=>{
			let configKeySplit = configKey.split("=");
			let secondHalf = configKeySplit.slice(1).join("=");
			let v = secondHalf.includes(CT.OBJECTSTART) 
			?{ value: secondHalf.replaceAll(this.oneSpace(),""), quoted: false } 
			:{ value: secondHalf.replaceAll(CT.QUOTE,""), quoted: secondHalf.includes(CT.QUOTE) } ;
			return { key: configKeySplit[0], value: v };
		});

		if (obsSource){
			var tasks = obsSource.toString().replaceAll(CT.QUOTE3,"");

			tasksArray = tasks.split(CT.NL)
			.map(this.maptrim)
			.filter(this.commentedLine)
			.map(f=>{
				let fs = f.trim().split(" "), rv = {};
				if (f.trim()==""){
					rv = {key: " "};
				} else if (f.includes(CT.ARROW)){
					rv = {key: f.trim()};
				} else {
					rv = {key: fs[0], _strval: fs.slice(1).join(" ").trim()};
				}
				return rv;
			})
			.map((task)=>{
				
				if (!task._strval) return task;

				let standardKeys = task._strval.replace(this.jsonDataTag(),"");

				if (task._strval.includes(CT.DATASTART)){
					let data = task._strval.match(this.jsonDataTagNeq()).toString().replace(CT.DATASTART,"").replace(CT.DATAEND,"");
					var dss = data.split(",");		
					task["_JSONNAME_"] = this.nameRefHack(task._strval);
					task["_JSONDATA_"] = dss.reduce((m,d)=>{
						let key = d.split(":")[0].replaceAll(CT.QUOTE,"").trim();
						let val = d.split(":")[1].replaceAll(CT.QUOTE,"").trim();
						let rval = d.split(":")[1].trim();
						m[key] = {val: val, quoted: d.split(":")[1].includes(CT.QUOTE) };
						return m;
					}, {});
				}

				this.charIndices(standardKeys, "=").forEach(equalsignPos=>{
					let quoted = standardKeys.charAt(equalsignPos+1) == CT.QUOTE;
					let keyStart = this.findKeyStart(standardKeys, equalsignPos);
					let valueEnd = this.findObjectEnd(standardKeys, equalsignPos, quoted)
					let key = standardKeys.substring(keyStart, equalsignPos);
					let value = standardKeys.substring(equalsignPos+1+(quoted?1:0), valueEnd-(quoted?1:0));
					task[key] = {quoted, value};
				});

				delete task._strval;
				return task;
			});
		}

		return { config: configArray, tasks: tasksArray }
	} 

}

module.exports = tomlToJson;