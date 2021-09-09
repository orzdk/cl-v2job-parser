var CT = require("./const");

class jsonToToml {

	wrap = (field, quote) => {

		return quote ?CT.QUOTE + field + CT.QUOTE :field;
	}

	isNotTheLastOne(obj, idx){

		return idx < obj.length-1;
	}

	renderDataKey = (task) => {
		let ds = CT.NL + CT.TAB2 + "  " + task._JSONNAME_ + CT.EQDATASTART + CT.NL;
		let jsonDataKeys = Object.keys(task._JSONDATA_);
		jsonDataKeys.map((key,i)=>{
			ds += CT.TAB3 + CT.QUOTE + key + CT.QUOTE + ": " + this.wrap(task._JSONDATA_[key].val, task._JSONDATA_[key].quoted) + (this.isNotTheLastOne(jsonDataKeys,i) ?"," + CT.NL :"");
		});
		ds += CT.TAB2 + CT.DATAEND;
		return ds;
	}

	renderToml = (json) => {

		let v2Job = "";

		json.config.map(c=>{
			var tabCount = c.key.length >= 20 ?0 :Math.floor((20-c.key.length)/4);
			v2Job += c.key + (tabCount>0?CT.TAB.repeat(tabCount):"") + "= " + this.wrap(c.value.value, c.value.quoted) + CT.NL;
		});

		if (json.tasks && json.tasks.length > 0) v2Job += "observationSource = " + CT.QUOTE3;

		json.tasks.map((task,i)=>{
			let valueKeys = Object.keys(task).filter(f=>!["_JSONDATA_", "_JSONNAME_", "key"].includes(f));
			let adjust = task.abi && task.abi.length > 16? CT.NL + CT.TAB2 + "  " : "";			
			
			if (task.key.trim()!="") {
				v2Job += CT.TAB + task.key + CT.TAB + (task.key.length<8?CT.TAB:"") + (task.type!==undefined ?"[" :"");
			}
		
			valueKeys.map((f,i)=>{
				v2Job += (i>0?adjust:"") + f + "=" + this.wrap(task[f].value, task[f].quoted) + (this.isNotTheLastOne(valueKeys,i)?" " :"");
			})

			if (task._JSONDATA_) v2Job += this.renderDataKey(task);
			if (task.type !== undefined) v2Job += "]"
			if (this.isNotTheLastOne(json.tasks,i)) v2Job += CT.NL;			
		});	

		if (json.tasks?.length>0) v2Job += CT.QUOTE3 + CT.NL;

		return v2Job;
	}

}

module.exports = jsonToToml;