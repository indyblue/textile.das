if(typeof require=='undefined') 
	var require = function() { return null; };
if(typeof module=='undefined')
	var module = { exports:null };

function oTextile() {
	var t = this;
	var escPats = [];

	var fnProps = function(str) {
		var style = '';
		var lang = '';
		var id = '';
		var cl='';
		var m;
		
		if(/\<\>|&lt;&gt;/i.test(str)) style += 'text-align:justify;';
		else if(/\<|&lt;/i.test(str)) style += 'text-align:left;';
		else if(/\>|&gt;/i.test(str)) style += 'text-align:right;';
		else if(/=/.test(str)) style += 'text-align:center;';
		
		// style
		var rx = /{([^}]*)}/;
		if(rx.test(str)) {
			m = str.match(rx);
			style += m[1];
			str = str.replace(rx,'');
		}

		// lang
		var rx = /\[([^}]*)\]/;
		if(rx.test(str)) {
			m = str.match(rx);
			lang += m[1];
			str = str.replace(rx,'');
		}

		// class/id
		var rx = /\(([^#()]*)#?([^()]*)\)/;
		if(rx.test(str)) {
			m = str.match(rx);
			cl += m[1];
			id += m[2];
			str = str.replace(rx,'');
		}

		// margins
		if((m=str.match(/\(/g))!=null && m.length>0) 
				style+= 'margin-left:'+m.length+'em;';
		else if((m=str.match(/\)/g)!=null && m.length)>0) 
			style+= 'margin-right:'+m.length+'em;';
		
		var retval = '';
		if(id!='') retval += ' id="'+id+'"';
		if(cl!='') retval += ' class="'+cl+'"';
		if(lang!='') retval += ' lang="'+lang+'"';
		if(style!='') retval += ' style="'+style+'"';
		return retval;
	};

	var patterns = [
		[ /==\]!\d+!\[==/, function($0) { alert("textile escaping error: "+$0); } ],

		[ /^==\s*$([\s\S]*?)^==\s*$/mg, function($0, txt) { 
			var i = escPats.length;
			escPats[i] = txt;
			return '==]!'+i+'![==';
		} ],
		[ /==(?!\]!\d+!\[==)(.+?)==/mg, function($0, txt) { 
			var i = escPats.length;
			escPats[i] = txt;
			return '==]!'+i+'![==';
		} ],

		[ /\\ae/mg, '&aelig;' ],
		[ /\\AE/mg, '&AElig;' ],
		[ /\\oe/mg, '&oelig;' ],
		[ /\\OE/mg, '&OElig;' ],

		[ /\\'([aeiouyAEIOUY])/mg, '&$1acute;' ],
		[ /\\`([aeiouyAEIOUY])/mg, '&$1grave;' ],
		[ /\\\^([aeiouyAEIOUY])/mg, '&$1circ;' ],
		[ /\\"([aeiouyAEIOUY])/mg, '&$1uml;' ],
		[ /\\'([^aeiouy{&])/mg, '$1&#x301;' ],
		[ /\\~([^aeiouy{&])/mg, '$1&#x303;' ],

		[ /\\'(&aelig;)/mg, '&#x1fd;' ],
		[ /\\'(&AElig;)/mg, '&#x1fc;' ],
		[ /\\'(&[^;]*;)/mg, '$1&#x301;' ],
		[ /\\'({[^}]*})/mg, '$1&#x301;' ],
		
		[ /<</mg, '&#x0ab;' ],
		[ />>/mg, '&#x0bb;' ],

		[ /--/mg, '&mdash;' ],
		[ /(^|\s)"([\w,.?!\(_'])/ig, '$1&ldquo;$2' ],
		[ /([\w;:,.?!\)_']|&rsquo; *|' *)"(\s|$|\[|-|&mdash;)/ig, '$1&rdquo;$2' ],
		[ /(^|\s|&ldquo; *|" *)'([\w,.?!\(_])/ig, '$1&lsquo;$2' ],
		[ /([\w;:,.?!\)_])'(\s|$|\[|&rdquo;|")/ig, '$1&rsquo;$2' ],
		[ /(\w)'(\w)/g, '$1&rsquo;$2' ],

		[ /(^|[\s.,:;'"!?()\[\]])(\*\*|__|\?\?|[*_\-+^~%@])(.*?)\2([\s.,:;'"!?()\[\]]|$)/mg, 
			function(m, op, type, txt, cp) {
				var rx = /(?:[({\[][^)}\]]*[)}\]])+/;
				var props = '';
				if(rx.test(txt)) {
					props = fnProps(txt.match(rx)[0]);
					txt = txt.replace(rx,'');
				}

				oType = { '_':'em', '*':'strong', '__': 'i', '**':'b',
					'-':'del', '+':'ins', '^':'sup', '~':'sub',
					'??':'cite', '%':'span', '@':'code' };
				var tag = 'span';
				if(op=='[') op = '';
				if(cp==']') cp = '';
				if(typeof oType[type] != undefined) tag = oType[type];
				//console.log(op+'<'+tag+' id="'+(id||'')+'" class="'+(cl||'')+'">'+txt+'</'+tag+'>'+cp);
				return op+'<'+tag+props+'>'+txt+'</'+tag+'>'+cp;
			} ],


		[ /(^|[(\s])([VR]\.)( )/mg, '$1<span class="VR">$2</span>$3' ],


		[ /\[fn([0-9a-z]*)\]/mig, '<sup><a class="fnlink" name="fnret$1" href="#fn$1">$1</a></sup>' ],
		[ /^fn([0-9a-z]*)\. (.*)$/gm, '<div><a class="fnote" href="#fnret$1" name="fn$1">$1</a>. $2</div>' ],
		[ /^(p|h\d)([^.]*). (.*)$/gm, function($0,tag,arg,txt) {
			var props = fnProps(arg);
			return '<'+tag+props+'>'+txt+'</'+tag+'>';
		} ], 


		[ /^\s*$/gm, '<br/>' ],
		[ /==\]!(\d+)!\[==/g, function($0, i) { return escPats[i]; } ]
	];

	t.toHtml = function(text) {
		for(var i=0;i<patterns.length;i++) {
			var pat = patterns[i];
			text = text.replace(pat[0], pat[1]);
		}
		return text;
	};

	t.fnMove = function($txt, $fn) {
		var $f = $txt.find('a.fnlink');
		var $n = $txt.find('a.fnote');
		if($f.length!=$n.length) {
			alert('footnote problem!')
			return;
		}
		for(var i=0;i<$f.length;i++) {
			var $fi = $f.eq(i);
			var $ni = $n.eq(i);
			var fnRepl = ($x, a)=> {
				$x.attr(a) = $x.attr(a).replace(/\d+$/,i+1);
			};
			var props = ['href', 'name', 'text'];
			for(var j = 0;j<props.length;j++){
				fnRepl($fi, props[j]);
				fnRepl($ni, props[j]);
			}
		}
		var $d = $n.parent();
		$d.detach()
		$fn.append($d);
	};
}

module.exports = oTextile;
