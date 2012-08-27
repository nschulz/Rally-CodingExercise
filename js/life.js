var kElemGenOne = "genOne",
	kElemGenTwo = "genTwo",
	kElemGenThree = "genThree",
	kTestData = [ 	[0,1,0,0,0],
					[1,0,0,1,1],
					[1,1,0,0,1],
					[0,1,0,0,0],
					[1,0,0,0,1]
				];
	
var kVector = {
		top: 			{ x: 0, y: 1 },
		topRight: 		{ x: 1, y: 1 },
		right: 			{ x: 1, y: 0 },
		bottomRight: 	{ x: 1, y: -1 },
		bottom: 		{ x: 0, y: -1 },
		bottomLeft: 	{ x: -1, y: -1 },
		left: 			{ x: -1, y: 0 },
		topLeft: 		{ x: -1, y: 1 }
	};



function Game(opts) {
	if (opts === undefined) opts = 5;
	
	this.gen1 = new Generation({ target: kElemGenOne, size: opts, enableLiveCalculations: true });
	this.gen2 = new Generation({ target: kElemGenTwo, size: opts });
	this.gen3 = new Generation({ target: kElemGenThree, size: opts });
	
	this.gen1._initDataSource();
	this.gen1.loadNeighborhoodData(kTestData);
	this.gen1._generateInputMatrix();
	
	this.gen2.evolveFromGeneration( this.gen1 );
	this.gen3.evolveFromGeneration( this.gen2 );
};
Game.prototype = {
	evolve: function() {
		this.gen2.evolveFromGeneration( this.gen1 );
		this.gen3.evolveFromGeneration( this.gen2 );
	}
};

function Generation(opts) {
	if (opts !== undefined) {
		this._size = opts.size;
		this._target = opts.target;
	} else {
		this._size = 5;
		this._target = kElemGenOne;
	}
	this._enableLiveCalculations = false;
	this._data = null;
	this._neighbors = null;
	
};

Generation.prototype = {
	getNeighborhoodSize: function() {
		return this._size;
	},
	setNeighborhoodSize: function( aSize ) {
		this._size = aSize;
		this._neighbors = null;
		this._initDataSource();
	},
	generateRandomNeighborhood: function() {
		this._initDataSource();
		this._generateInputMatrix();
	},
	getGenerationData: function() {
		return this._data;
	},
	evolveFromGeneration: function( aGen ) {
		this.loadNeighborhoodDataFromGen( aGen );
		this.evolveNumberOfGenerations(1);
		this._generateInputMatrix();
	},
	loadNeighborhoodData: function( aDataSet ) {
		for ( var i = 0; i < this._size; i++ ) {
			for ( var j = 0; j < this._size; j++ ) {
				this._data[i][j] = aDataSet[i][j];
			}
		}

	},
	loadNeighborhoodDataFromGen: function( aGen ) {
		this.setNeighborhoodSize( aGen.getNeighborhoodSize() );

		var gDS = aGen.getGenerationData();
		
		this.loadNeighborhoodData( gDS );
	},
	evolveNumberOfGenerations: function( genCount ) {
		for ( var gen = 0; gen < genCount; gen++ ) {
			this._currentData = [];
			for ( var i = 0; i < this._size; i++ ) {
				this._currentData[i] = this._data[i].slice();
			}
			for ( i = 0; i < this._size; i++ ) {
				for ( var j = 0; j < this._size; j++ ) {
					this.evolveNeighborAtPath( i, j );
				}
			}
		}
	},
	evolveNeighborAtPath: function( i, j ) {
		var liveNeighborCount = 0;
		for ( var k in kVector ) {
			if (this._neighborAtVector( i, j, kVector[k] ) == 1) liveNeighborCount++;
		}
		
		var d = this._data;
		
		console.log(i+" " +j+" "+liveNeighborCount);
		
		var currentValue = d[i][j];
		
		if (liveNeighborCount < 2) {
			d[i][j] = 0;
			console.log("cell at "+i + " "+j+" will die off with less than 2");
		} else if (liveNeighborCount > 3) {
			d[i][j] = 0;			
			console.log("cell at "+i + " "+j+" will die off from over pop: "+liveNeighborCount);
		} else if (liveNeighborCount == 3) {
			d[i][j] = 1;
			console.log("cell at "+i + " "+j+" will reproduce off from: "+liveNeighborCount);
		} else {
			console.log("cell at "+i + " "+j+" will not be changed");
		}
		
	},
	setValueForCell: function(v,i,j) {
		this._data[i][j] = v;	
	},
	_neighborAtVector: function( i, j, k ) {
		var _i = i+k.y,
			_j = j+k.x;
		if (_i < 0 || _i >= this._size) return null;
		if (_j < 0 || _j >= this._size) return null;
		if (this._currentData[_i] !== undefined && this._currentData[_i][_j] !== undefined) return this._currentData[_i][_j];
		return null;
	},
	_initDataSource: function() {
		delete this._data;
		this._data = [];
		for ( var i = 0; i < this._size; i++ ) {
			this._data[i] = [];
						
			for ( var j = 0; j < this._size; j++ ) {
				this._data[i][j] = this._randomNeighbor();
			}
		}
		return this._data;	
	},
	_randomNeighbor: function() {
		return ((Math.random() > 0.5) ? 1 : 0);
	},
	_generateInputMatrix: function() {
		delete this._neighbors;
		this._neighbors = [];
		
		var docFrag = document.createDocumentFragment();
		
		for ( var i = 0; i < this._size; i++ ) {
			this._neighbors[i] = [];
			
			var rowElem = new Elem({ tag: "div", styleClass: "row" });
			
			for ( var j = 0; j < this._size; j++ ) {
				var cellElem = new Elem({ tag: "div", styleClass: "cell" });

				this._neighbors[i][j] = new Neighbor({ data: this._data[i][j], generation: this, indexPath: { "i":i, "j": j } });

				cellElem.appendChild( this._neighbors[i][j].getInputElem() );
				rowElem.appendChild( cellElem );
			}
			
			docFrag.appendChild( rowElem );
		}
		$ID(this._target).innerHTML = "";
		$ID(this._target).appendChild( docFrag );
	}
};

function Neighbor(attr) {
	var self = this;
	
	for (var i in attr) this[i] = attr[i];
	
	this._input = new Elem({ tag: "input", type: "text", size: 1 });
	this._input.addEventListener('keyup', function(evt) {
		self.generation.setValueForCell( self.getValue(), self.indexPath.i, self.indexPath.j );
	}, false);
	
	this.setValue( attr.data );
};
Neighbor.prototype = {
	setValue: function(v) {
		this._input.value = v;	
	},
	getValue: function() {
		return this._input.value;
	},
	getInputElem: function() {
		return this._input;
	}
};



function Elem(attr) {
	if (typeof attr == "object") {
		var _elem = document.createElement(attr.tag);
		for (var i in attr) {
			var ilc = i.toLowerCase();
			if (ilc == "tag") continue;
			if (ilc == "styleclass") {
				_elem.className = attr[i];
				continue;
			}
			_elem.setAttribute(i, attr[i]);
		}
	}
	if (attr == "clear") return new Elem("div", "", "clear");
	
	if ( !_elem.addEventListener ) {
		_elem.addEventListener = function(eventName, action) {
			this.attachEvent("on"+eventName, action);
		};
		_elem.removeEventListener = function(eventName, action) {
			this.detachEvent("on"+eventName, action);
		};
	}

	return _elem;
};

function $ID( id ){
	return document.getElementById(id);	
};

function BindEvents() {
	var popupSelect = $ID('sizeSelect');
	popupSelect.addEventListener("change", function(evt) {
		GAME = new Game( parseInt(popupSelect.options[popupSelect.selectedIndex].value) );
	}, false);
};