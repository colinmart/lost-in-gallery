// Basic Choose Your Own Adventure Game - by Colin Mart
// "LOST IN GALLERY" - inspired by "Ib"
// Credits:
// "thud1" by JWMalahy, from freesound.org: sound of Lady dropping to floor
// "draggingvinyl" by MAJ061785, from freesound.org: sound of Lady moving
// "slashkut" by Abyssmal, from freesound.org: sound of Lady attacking
// "samurai slash" by nekoninja, from freesound:org: sound of hitting Lady with the knife

// ~~~~~~ GAME OBJECTS ~~~~~~

// Room(idNum, deText, roomObjects, roomEntities, roomExits): An object constructor function to construct a "room", an object type representing a room within the Gallery.
// Rooms have:
//	An index, identifying which room this is.  This number should be unique.
//	A descText, which contains the description of the room and is printed to the textbox whenever you enter the room.
//	An items, an array of every item that's currently in the room.
//  An entities, an array of every entity that's currently in the room.  Entities are like items, but GET doesn't work and they can act on their own.
//  An exits, an array of potential exits to the room.j  This is an associative array linking strings to index numbers.
	// Valid keys for 'exits' are "W", "NW", "N", "NE", "E", "SE", "S", "SW", "IN", "OUT", "UP", and "DOWN".
// idNum = index, deText = descText.  roomItems = items.  roomEntities = entities.  roomExits = exits.
function Room(idNum, deText, roomItems, roomEntities, roomExits)
{
	this.index = idNum;
	this.descText = deText;
	this.items = roomItems;
	this.entities = roomEntities;
	this.exits = roomExits;
}

// Item(idName, idAliases, deText, itemGet, itemAct, uses, reacts): An object constructor function to construct a "item", an object type representing an item within the Gallery.
// Rooms have:
// 	An ident, identifying this item.  The item responds to commands with its name in them.
//  An array of alliases, identifying other names that will be considered to refer to this item (often shortened versions of its proper name).
//  A descText, which contains the description of the object and is printed whenever you LOOK at the object.
//  A placeText, which contains the short description of the object that goes into room descriptions where the object is present.
//  A canGet, a boolean which determines whether or not you can GET the object for your inventory.
//  An itemUse, a function which runs when you USE the item by itself.
//  An itemReaction, a key-function array which determines how the item reacts to having another item USED on it.
//  All functions for two-item use take the inventory position of the first item used as input.
// idName = ident, idAliases = alias, deText = descText, plText = placeText, itemGet = canGet, canUse = itemAct, itemUse = uses, itemReaction = reacts
function Item(idName, idAliases, deText, plText, itemGet, itemAct, uses, reacts)
{
	this.ident = idName;
	this.alias = idAliases;
	this.descText = deText;
	this.placeText = plText;
	this.canGet = itemGet;
	this.canUse = itemAct;
	this.itemUse = uses;
	this.itemReaction = reacts;
}

// Entity(idName, idAliases, deText, uses, reacts, routine): An object constructor function to construct a "entity", an object type representing a living person.
// Entities will act every time a command that passes time is successfully activated (MOVE, GET, or USE).
// Entities have:
// 	An ident, identifying this entity.  The entity responds to commands with its name in them.
//  An array of alliases, identifying other names that will be considered to refer to this entity (often shortened versions of its proper name).
//  A descText, which contains the description of the entity and is printed whenever you LOOK at the entity.
//  A placeText, which contains the short description of the entity that goes into room descriptions where the entity is present.
//  An itemReaction, a key-function array which determines how the entity reacts to having an item USED on it.
//  All functions for inventory-item use take the inventory position of the item used as input.
//  A dialogue, which determines how it reacts to the TALK command.
//  A brain, which contains an AI function activated every time a time-passing command is successfully activated.
//  A myLocation, which contains the room in which the current entity exists.  Useful in certain command logics.
// idName = ident, idAliases = alias, deText = descText, plText = placeText, itemReaction = reacts, dialogue = speech, brain = routine, myLocation = ownLoc.
function Entity(idName, idAliases, deText, plText, reacts, speech, routine, ownLoc)
{
	this.ident = idName;
	this.alias = idAliases;
	this.descText = deText;
	this.placeText = plText;
	this.itemReaction = reacts;
	this.dialogue = speech;
	this.brain = routine;
	this.myLocation = ownLoc;
}


// ~~~~~~ GAME VARIABLES ~~~~~~

// roomArray holds every room in the game, identified by their index number.  (Which should be the same as their position in the array.)
var roomArray = [];

// itemArray holds data on every item in the game.
var itemArray = [];

// entityArray holds data on every item in the game.
var entityArray = [];

// currentRoom determines what room the player is in when they start the game.  The value this begins at is the starting room for the game.
var currentRoom = 1;

// inventory holds every item which you currently possessed (that you've taken by commands).
var inventory = [];

// yourAppearance is what gets printed to the screen when you LOOK at yourself.  It can change over the course of the game due to certain events.
// First line is your general description, second line is your clothing, third line is your current health.
var yourAppearance = [
"You're a young girl of about seven or eight, with bright eyes beneath long brown tresses that gleam cheerfully at passerby.",
"Your dress is lacy and black, about knee-length, with a neat white bow around your neck.",
"You have a plain bandage on your left cheek, from a cut you got playing outside."
];

// yourHP determines how many hits you can take.  If it reaches 0, you die and get a game over.
var yourHP = 5;

// Tracks the HP of the game's one enemy.
var enemyHP = 5;

// darkEnding indicates whether you'll get the 'light' or 'dark' version of the ending (ending A and B respectively).
var darkEnding = false;

// Indicates whether the game is currently in 'dark mode' (the background is black and the text is white).
var darkMode = false;

// entityDesc is what gets printed to the lower 'entity handling' window of the screen whenever an entity's AI demands that it should be so.
var entityDesc = "";

// soundArray holds all the sound paths used in the game.
//	id 0 is the sound for the Lady dropping to the floor.
//	id 1 is the sound for the Lady moving.
//	id 2 is the sound for the Lady attacking.
//	id 3 is the sound for using the knife on the Lady.
var soundArray = [];
soundArray[0] = "resources/146981__jwmalahy__thud1.mp3";
soundArray[1] = "resources/85545__maj061785__dragging-vinyl.mp3";
soundArray[2] = "resources/35213__abyssmal__slashkut.mp3";
soundArray[3] = "resources/370204__nekoninja__samurai-slash.mp3"

// ~~~~~~ PATHFINDING ENGINE ~~~~~~
// This section of the code contains the adjacency list used in pathfinding for entities, and the commands required to make it work.

// An adjacency list mapping the 'light' gallery.  Not used.
var galleryMap = {};
galleryMap[2] = [3];
galleryMap[3] = [2,4,5];
galleryMap[4] = [3,6,7];
galleryMap[5] = [3,6];
galleryMap[6] = [4,5];
galleryMap[7] = [4,8];
galleryMap[8] = [7,9,10];
galleryMap[9] = [8,11];
galleryMap[10] = [8,12];
galleryMap[11] = [9,12];
galleryMap[12] = [10,11];

// An adjacency list mapping the 'dark' gallery.
var galleryMapDark = {};
galleryMapDark[13] = [14,17];
galleryMapDark[14] = [13,15];
galleryMapDark[15] = [14,16];
galleryMapDark[16] = [15,17,18];
galleryMapDark[17] = [13,16];
galleryMapDark[18] = [16,19];
galleryMapDark[19] = [18,20,22];
galleryMapDark[20] = [19,21];
galleryMapDark[21] = [20,22];
galleryMapDark[22] = [19,21,23,24];
galleryMapDark[23] = [22];
galleryMapDark[24] = [22,25];
galleryMapDark[25] = [24];

// Node(val,pri,n): A custom object designed to go in the custom heap below.
// Nodes have:
// 	A value, which is stored in the node for retrieval.
//	A priority, indicating how 'important' this node is.
// val = value, pri = priority.
function Node(val,pri,n)
{
	this.value = val;
	this.priority = pri;
}

// PriorityQueue(): A custom object designed to wrap an array and give it the basic functions of a priority queue (binary heap implementation, in this case).
// Lower priority is better in this queue.
function PriorityQueue()
{
	this.data = []
	// pushNode(newNode): A function that inserts a new node into the priority queue based on its priority.
	this.pushNode = function(newNode)
	{
		// First, we make sure the queue isn't empty.
		if (this.data.length > 0)
		{
			// Otherwise, we iterate through the list and insert the node as soon as we find one with lower priority.
			for (var iterate = 0; iterate < this.data.length; iterate++) 
			{
				if (this.data[iterate].priority > newNode.priority)
				{
					this.data.splice(iterate,0,newNode);
					return;
				}
			}
			// If we find nothing, just push the node in at the end.
			this.data.push(newNode);
		} else {
		// If the queue is empty, we can append the new node as the first node.
			this.data.push(newNode);
		}
		
	}
	// popNode(): A function that removes the first node from the queue and returns its value.
	this.popNode = function()
	{
		return this.data.shift().value;
	}
	// decPriority(target,newPri): A function that lowers the priority of node 'target' to 'newPri'.
	// This naive implementation simply removes the node and reinserts it with its new priority.
	this.decPriority = function(target,newPri)
	{
		var targetNode = null;
		for (var iterate = 0; iterate < this.data.length; iterate++) 
		{
			if (this.data[iterate].value == target)
			{
				targetNode = this.data[iterate];
				this.data.splice(iterate,1);
			}
		}
		// Abort if we couldn't find the node.
		if (targetNode == null)
		{
			console.log("Failed to find a node with dropKey.");
			return;
		}
		targetNode.priority = newPri;
		this.pushNode(targetNode);
	}
}

// findShortestPath(locA,locB,graph): Finds the shortest path from locA to locB on 'graph' using Dijkstra's algorithm.
// In practical terms, what we're actually returning is the first node you should move to from locA to reach locB in optimal time.
// Returns a tuple of the location and the distance to it.
function findShortestPath(locA,locB,graph)
{
	var keyA = locA.toString();
	var keyB = locB.toString();
	// First, make an array to record our findings of the graph and the distance to various things.
	var distanceArray = {};
	distanceArray[keyA] = 0;
	var previousArray = {};
	var mappingQueue = new PriorityQueue();
	
	// For every node in the graph:
	for (var iterate in graph)
	{
		// If that node doesn't belong to the prototype:
		if (graph.hasOwnProperty(iterate)) {
			// If it's not the node where we started:
			if (iterate != keyA)
			{
				// Add it to the graph.
				distanceArray[iterate] = Infinity;
				previousArray[iterate] = null;
			}
			// Regardless, throw the node into the mapping array.
			mappingQueue.pushNode(new Node(parseInt(iterate, 10),distanceArray[iterate]));
			}
	}
	
	// Now that we're done:
	var nodeIter;
	var newDist;
	var iterValue;
	// As long as the mapping queue isn't empty:
	while (mappingQueue.data.length > 0)
	{
		// Get the node with the best priority.
		nodeIter = mappingQueue.popNode().toString();
		
		// If this is locB, we're done.
		if (nodeIter == keyB) { break; }
		// Otherwise, for every adjacent node:
		for (var iterate = 0; iterate < graph[nodeIter].length; iterate++)
		{
			iterValue = graph[nodeIter][iterate];
			// Find the distance from the prevous node to the new one, then change recorded distance if the new one is lower.
			newDist = parseInt(distanceArray[nodeIter], 10) + 1;
			if (newDist < distanceArray[iterValue])
			{
				distanceArray[iterValue] = newDist;
				previousArray[iterValue] = nodeIter;
				mappingQueue.decPriority(iterValue,newDist);
			}
		}
	}
	
	// We now have an array - previousArray - that allows us to retrace our steps and determine which node we need to start from to use our 'fastest path'.
	// We also have distanceArray, which tells us how far away the destination is.
	nodeIter = previousArray[keyB];
	var result = keyB;
	while ((nodeIter != keyA) && (nodeIter != null))
	{
		result = nodeIter;
		nodeIter = previousArray[nodeIter];
	}
	
	// At last, we can return the result.
	return [parseInt(result,10),distanceArray[keyB]];
}

// ~~~~~~ SOUND ENGINE ~~~~~~
// This section of the code contains the code used to play sounds based on distance to the player.

// playAudio(sound,distance): Plays the sound 'sound' as though the source was 'distance' rooms away from the player, using audio channel 'channel'.
function playAudio(sound,distance,channel)
{
	var playSound;
	switch (channel)
	{
		case 1:
			playSound = document.getElementById("channelOne");
			break;
		case 2:
			playSound = document.getElementById("channelTwo");
			break;
		default:
			return;
	}
	// First stop the old audio if one is playing.
	playSound.pause();
	playSound.currentTime = 0;
	// Set the new audio.
	playSound.src = sound;
	playSound.load();
	// Audio directly atop the player (distance 0) plays at 100% volume.  Anything quieter plays at 25% less for every 1 distance between the player and the source.
	// As the result of this, any sound 4 rooms or further away is just silent.
	var volume = 1 - (distance * 0.25);
	// The audio doesn't play if it would be silent.
	if (volume > 0)
	{
		playSound.volume = volume;
		playSound.play();
	}
}


// ~~~~~~ GAME FUNCTIONS ~~~~~~

// printText(outputText): Erases the current text in the user's browser window if any, and prints the contents of the string "outputText" in its place.
function printText(outputText)
{
	// This function is simply a convenient wrapper to shorten the function we're actually calling; the replacement of the innerHTML of 'textbox' with the new text.
	document.getElementById("textbox").innerHTML = outputText;
}

// displayEntText(): Erases the current text in the user's entity-watcher window if any, and prints the current contents of entityDesc in its place.
function displayEntText()
{
	// This function is simply a convenient wrapper to shorten the function we're actually calling; the replacement of the innerHTML of 'entitybox' with the new text.
	document.getElementById("entitybox").innerHTML = entityDesc;
}

// appendEntText(outputText): Adds outputText to the current entityDesc.
function appendEntText(outputText)
{
	entityDesc += outputText + "<br>";
}

// clearEntText(): Erases the current text in the user's entity-watcher window if any.  Also erases the current contents of entityDesc.
function clearEntText()
{
	// This function is simply a convenient wrapper to shorten the function we're actually calling; the replacement of the innerHTML of 'entitytbox' with the new text.
	document.getElementById("entitybox").innerHTML = "";
	entityDesc = "";
}

// printError(outputText): Erases the current text in the user's error window if any, and prints the contents of the string "outputText" in its place.
function printError(outputText)
{
	// This function is simply a convenient wrapper to shorten the function we're actually calling; the replacement of the innerHTML of 'errorbox' with the new text.
	document.getElementById("errorbox").innerHTML = outputText;
}

// clearError(): Erases the text in the error box, causing the error to display no longer.  Identical to calling printError with a null string as input.
function clearError(outputText)
{
	document.getElementById("errorbox").innerHTML = "";
}

//goToRoom(newRoom): Moves the player from their previous room to a new room within the room array, and activates all events that need to happen upon room shift
// (prints new text, displays the user's options, activates any interested events, etc.)  newRoom is an integer referring to that room's location in the room array.
function goToRoom(newRoom)
{
	// As soon as it's entered, the new room's description is printed.
	lookAtRoom(newRoom);
	// The current room is set to the newly entered room.
	currentRoom = newRoom;
}

// Looks at the current room, displaying its description onto the screen.
function lookAtRoom(yourRoom)
{
	// First, the variable newText is created to hold all of the required text to print.
	var newText = "";
	// The room's description text is concatenated into newText.
	newText += roomArray[yourRoom].descText;
	// If there's anything in the items array:
	if ((roomArray[yourRoom].items !== undefined) && (roomArray[yourRoom].items.length > 0)) {
		// For each item in the items array:
		for (var obj in roomArray[yourRoom].items)
		{
			// If that item belongs to the array and not the prototype:
			if (roomArray[yourRoom].items.hasOwnProperty(obj))
			{
				// Add appropriate spacing.
				newText += "<br><br>"
				// Append that item's short description to the description text.
				newText += (roomArray[yourRoom].items[obj].placeText);
			}
		}
	}
	// If there's anything in the entities array:
	if ((roomArray[yourRoom].entities !== undefined) && (roomArray[yourRoom].entities.length > 0)) {
		// For each entity in the entities array:
		for (var obj in roomArray[yourRoom].entities)
		{
			// If that entity belongs to the array and not the prototype:
			if (roomArray[yourRoom].entities.hasOwnProperty(obj))
			{
				// Add appropriate spacing.
				newText += "<br><br>"
				// Append that entity's short description to the description text.
				newText += (roomArray[yourRoom].entities[obj].placeText);
			}
		}
	}
	// The beginning of the exit text is printed.
	newText += "<br><br>Exits are | ";
	// Text describing the room's exits is generated and concatenated into newText.
	// For each key in the exits array:
	for (var key in roomArray[yourRoom].exits)
	{
		// If that key belongs to the array and not the prototype:
		if (roomArray[yourRoom].exits.hasOwnProperty(key))
		{
			// Append that exit to the total text.
			newText += (key + " | ");
		}
	}
	// Print the total body of text.
	printText(newText);	
}

// Looks at yourself, displaying the player's current appearance in whole.
function lookAtMe()
{
	// First, the variable newText is created to hold all of the required text to print.
	var newText = "";
	// The player's basic information is concatenated into newText.
	newText += yourAppearance[0];
	// Space is added.
	newText += "<br>";
	// The player's current clothing is concatenated into newText.
	newText += yourAppearance[1];
	// Space is added.
	newText += "<br>";
	// The player's current damage is concatenated into newText.
	newText += yourAppearance[2];
	// The total body of text is printed.
	printText(newText);
}

// Looks at an item, displaying its description text.
function lookAtItem(itemTarget)
{
	printText(roomArray[currentRoom].items[itemTarget].descText);
}

// Looks at an item you're carrying, displaying its description text.
function lookAtOwnItem(itemTarget)
{
	printText(inventory[itemTarget].descText);
}

// Looks at an entity, displaying its description text.
function lookAtEntity(entTarget)
{
	printText(roomArray[currentRoom].entities[entTarget].descText);
}

// Looks at what's currently in your inventory.
function lookAtInventory()
{
	// First, the variable newText is created to hold all of the required text to print.
	var newText = "";
	// If there's anything in the inventory:
	if ((inventory !== undefined) && (inventory.length > 0)) {
		// Append the beginning of the inventory readout.
		newText += "You're carrying | ";
		// One by one, the items in the inventory are appended to newText.
		for (var obj in inventory)
		{
			// If that item belongs to the array and not the prototype:
			if (inventory.hasOwnProperty(obj))
			{
				// Append that item's name to the description text.
				newText += (inventory[obj].ident + " | ");
			}
		}
	// Otherwise, print that the player is carrying nothing.
	} else {
		newText += "You're not carrying anything with you."
	}
	// To conclude, the total body of text is printed.
	printText(newText);
}

// Displays an entity's dialogue.
function lookAtDialogue(entTarget)
{
	printText(roomArray[currentRoom].entities[entTarget].dialogue);
}

// Displays the list of commands again.
function lookAtHelp()
{
	// The help text is printed.
	printText("<br>Commands:<br>" +
	"DIRECTION: Move in that direction.  (For example: N means go North.)<br>" +
	"LOOK X: Look at object X.  (For example: LOOK CHAIR to look at CHAIR.)  <i>(This works on objects in your inventory.)</i><br>" +
	"GET X: Get object X, if you can.  (For example: GET PEN to get a PEN.)<br>" +
	"USE X: Use object X, if you can.  (For example: USE PEN to use a PEN.)  <i>(This works on objects in your inventory.)</i><br>" +
	"USE X ON Y: Use object X from your inventory on object Y in the environment.  (For example: USE PEN ON PAPER.)<br>" +
	"ITEMS: Look at what you're currently carrying.<br>" +
	"TALK X: Try to strike up a conversation with person X.<br>" +
	"HELP: See the list of commands again.<br>" +
	"<i>Commands are case insensitive.</i><br>" +
	"<br>Type LOOK to see the room again.");
}

// checkItemContext(cmdTarget): This function takes a command fragment, cmdTarget, and checks the name of every item in the current room to see if any them match the command.
// checkItemContext also checks the command against every 'alias' of an item.
function checkItemContext(cmdTarget)
{
	// If the item array for this room exists:
	if ((roomArray[currentRoom].items !== undefined) && (roomArray[currentRoom].items.length > 0)) {
		// For each item in the items array:
		for (var obj in roomArray[currentRoom].items)
		{
			// If that item belongs to the array and not the prototype:
			if (roomArray[currentRoom].items.hasOwnProperty(obj))
			{
				// If the command matches the item's name, this is the correct item; return as much.
				if (cmdTarget == roomArray[currentRoom].items[obj].ident) { return obj; }
				// Otherwise, check if the command matches any of that item's aliases; if so, return this item.
				else {
					for (var objAlias in roomArray[currentRoom].items[obj].alias) {
						if (cmdTarget == roomArray[currentRoom].items[obj].alias[objAlias]) { return obj; }
					}
				}
				// If none of these things matched, move on to the next item in the loop.
			}
		}
	}
	// If the command failed to find any item to match the command against, return -1 to indicate as much.
	return -1;
}

// checkInvContext(cmdTarget): This function takes a command fragment, cmdTarget, and checks the name of every item in the inventory to see if any them match the command.
// checkInvContext also checks the command against every 'alias' of an item.
function checkInvContext(cmdTarget)
{
	// If the inventory exists:
	if ((inventory !== undefined) && (inventory.length > 0)) {
		// For each item in the inventory:
		for (var obj in inventory)
		{
			// If that item belongs to the array and not the prototype:
			if (inventory.hasOwnProperty(obj))
			{
				// If the command matches the item's name, this is the correct item; return as much.
				if (cmdTarget == inventory[obj].ident) { return obj; }
				// Otherwise, check if the command matches any of that item's aliases; if so, return this item.
				else {
					for (var objAlias in inventory[obj].alias) {
						if (cmdTarget == inventory[obj].alias[objAlias]) { return obj; }
					}
				}
				// If none of these things matched, move on to the next item in the loop.
			}
		}
	}
	// If the command failed to find any item to match the command against, return -1 to indicate as much.
	return -1;
}

// checkEntityContext(cmdTarget): This function takes a command fragment, cmdTarget, and checks the name of every entity in the room to see if any them match the command.
// checkEntityContext also checks the command against every 'alias' of an entity.
function checkEntityContext(cmdTarget)
{
	// If the entity array for this room exists:
	if ((roomArray[currentRoom].entities !== undefined) && (roomArray[currentRoom].entities.length > 0)) {
		// For each entity in the entity array:
		for (var obj in roomArray[currentRoom].entities)
		{
			// If that entity belongs to the array and not the prototype:
			if (roomArray[currentRoom].entities.hasOwnProperty(obj))
			{
				// If the command matches the entity's name, this is the correct entity; return as much.
				if (cmdTarget == roomArray[currentRoom].entities[obj].ident) { return obj; }
				// Otherwise, check if the command matches any of that entity's aliases; if so, return that entity.
				else {
					for (var objAlias in roomArray[currentRoom].entities[obj].alias) {
						if (cmdTarget == roomArray[currentRoom].entities[obj].alias[objAlias]) { return obj; }
					}
				}
				// If none of these things matched, move on to the next entity in the loop.
			}
		}
	}
	// If the command failed to find any entity to match the command against, return -1 to indicate as much.
	return -1;
}

// removeSelf(cmdTarget,roomTarget): Used so entities can remove themselves from a room's array, presumably to reinsert themselves somewhere else afterwards.
function removeSelf(cmdTarget,roomTarget)
{
	// If the entity array for this room exists:
	if ((roomArray[roomTarget].entities !== undefined) && (roomArray[roomTarget].entities.length > 0))
	{
		// For each entity in the entity array:
		for (var obj in roomArray[roomTarget].entities)
		{
			// If that entity belongs to the array and not the prototype:
			if (roomArray[roomTarget].entities.hasOwnProperty(obj))
			{
				// If the command matches the entity's name, this is the correct entity; remove it from the array.
				if (cmdTarget == roomArray[roomTarget].entities[obj].ident) {
					roomArray[roomTarget].entities.splice(obj,1);
				}
				// No need to check for aliases here.
				// If none of these things matched, move on to the next entity in the loop.
			}
		}
	}
}

// damagePlayer(): Deals damage to the player, and kills them if their health is too low.
function damagePlayer()
{
	yourHP -= 1;
	switch(yourHP) {
		case 4:
			yourAppearance[1] = "Your dress is lacy and black, about knee-length, with a neat white bow around your neck.  There's a bloody slash through its shoulder.";
			yourAppearance[2] = "A deep wound across your shoulder slowly drools blood.";
			break;
		case 3:
			yourAppearance[1] = "Your dress is lacy and black, about knee-length, with a neat white bow around your neck.  There's multiple gashes through it.";
			yourAppearance[2] = "There are several deep gashes across your body, slowly drooling blood.";
			break;
		case 2:
			yourAppearance[1] = "Your dress is lacy and black, about knee-length, with a neat white bow around your neck.  There's many gashes through it.";
			yourAppearance[2] = "Your form is completely lacerated with deep, bloody gashes.  You stumble every so often as you try to walk.";
			break;
		case 1:
			yourAppearance[1] = "Your dress is nearly shredded, drenched in your own blood.  The bow's white coloration is no longer obvious.";
			yourAppearance[2] = "You've lost track of your own injuries.  All you can do is stumble forward and hope your body doesn't give out.";
			break;
		default:
			window.location.href = "resources/Over.html";
	}
}

// passTime(): This function causes time to pass - and any entity that can act while time is passing to do so.
function passTime()
{
	// To begin, we clear whatever the precious entityDesc was.
	clearEntText();
	// For every entity in the game:
	for (var ent in entityArray)
	{
		// If that entity belongs to the array and not to the prototype:
		if (entityArray.hasOwnProperty(ent))
		{
			// Call that entity's AI function.  It will take over from here.
			entityArray[ent].brain();
		}
	}
	// Finally, we print the new entityDesc (which may have changed due to entities' AI functions).
	displayEntText();
}

// cmdMove(moveDir): This function is activated by the player's 'move' command.  (A direction was input.)  It takes said direction as its input.
function cmdMove(moveDir)
{
	if (moveDir in roomArray[currentRoom].exits) {
		// Take the player to the new room, then pass time.
		goToRoom(roomArray[currentRoom].exits[moveDir]);
		passTime();
	} else {
		printError("This room doesn't have an exit in the " + moveDir + " direction.");
	}
}

// cmdLook(lookTarget): This function is activated by a basic 'look' command.  It looks at the given target.
function cmdLook(lookTarget)
{
	// There are a few special variations of the LOOK command that are always available, in addition to looking at certain things.
	// A LOOK command with no additional input will look at the room you're in again.  There are a few aliases with the same result.
	if ((lookTarget == "") || (lookTarget == "HERE") || (lookTarget == "AROUND") || (lookTarget == "ROOM")) {
		lookAtRoom(currentRoom);
	// The player can look at their own appearance, which can be changed by various in-game events.
	} else if ((lookTarget == "SELF") || (lookTarget == "ME") || (lookTarget == "MYSELF")) {
		lookAtMe();
	// The LOOK command can also be used to access the inventory.
	} else if ((lookTarget == "ITEMS") || (lookTarget == "INVENTORY") || (lookTarget == "MY ITEMS") || (lookTarget == "MY INVENTORY")) {
		lookAtInventory();
	// If the player is looking at none of those things, every item in the room is checked to see if it could be what they're looking for.
	} else {
		// All items are checked to see if they might be what's being looked at.
		var itemTarget = checkItemContext(lookTarget);
		// If it is in fact one of them, LOOK at that item.
		if (itemTarget >= 0) {
			lookAtItem(itemTarget);
			return;
		}
		// Otherwise, perform the same check and logic on the inventory.
		itemTarget = checkInvContext(lookTarget);
		if (itemTarget >= 0) {
			lookAtOwnItem(itemTarget);
			return;
		}
		// Otherwise, perform the same check and logic on the entities in the room.
		itemTarget = checkEntityContext(lookTarget);
		if (itemTarget >= 0) {
			lookAtEntity(itemTarget);
			return;
		}
		// Otherwise, there's nothing left as a potential target; return an error.
		printError("You can't see " + lookTarget + " here.");
	}
}

// cmdGet(getTarget): This function is activated by a 'get' command.  It takes the given target, if the target is an item that can be taken.
function cmdGet(getTarget)
{
	// To begin, all items in the room are checked to see if they might be a potential target for the GET command.
	var itemTarget = checkItemContext(getTarget);
	// If the item to GET is here, check whether or not it's a valid GET target.
	if (itemTarget >= 0) {
		// If it is, put it into the player's inventory and remove it from the room.
		if (roomArray[currentRoom].items[itemTarget].canGet) {
			inventory.push(roomArray[currentRoom].items[itemTarget]);
			roomArray[currentRoom].items.splice(itemTarget,1);
			// This changes the room description, so look at it again.
			lookAtRoom(currentRoom);
			// Pass time.
			passTime();
		// Otherwise, print an error.
		} else {
			printError("You can't carry " + getTarget + " with you.");		
		}
	// Otherwise, the item to GET isn't here.
	} else {
		// All entities are checked.  (You can't USE an entity, but it's helpful to be able to give a different error message if the player tried to.)
		var entTarget = checkEntityContext(getTarget);
		if (entTarget >= 0) {
			printError("You get the feeling that they wouldn't appreciate being picked up.");
		} else {
			printError("You can't see " + getTarget + " here.");
		}
	}
}

// cmdUse(useTarget): This function is activated by a single target 'use' command.  It activates the given target's use function.
function cmdUse(useTarget)
{
	// To begin, all items in the room are checked to see if they might be a potential target for the USE command.
	var itemTarget = checkItemContext(useTarget);
	// If the item to USE is in the room, then call its USE function - if it has one.  Otherwise, note that the item can't be used (at least on its own).
	// Pass time if successful.
	if (itemTarget >= 0) {
		if (roomArray[currentRoom].items[itemTarget].canUse) { roomArray[currentRoom].items[itemTarget].itemUse(); passTime(); }
		else { printError("You don't see any way to use " + useTarget + "."); }
		return;
	}
	// Next, all inventory objects are checked as well.
	var invTarget = checkInvContext(useTarget);
	// If the item to USE is in the inventory, then call its USE function - if it has one.  Otherwise, note that the item can't be used (at least on its own).
	// Pass time if successful.
	if (invTarget >= 0) {
		if (inventory[invTarget].canUse) { inventory[invTarget].itemUse(); passTime(); }
		else { printError("You don't see any way to use " + useTarget + "."); }
		return;
	}
	// Next, all entities are checked.  (You can't USE an entity, but it's helpful to be able to give a different error message if the player tried to.)
	var entTarget = checkEntityContext(useTarget);
	if (entTarget >= 0) {
		printError("Ah.  So you're one of those 'nihilists'.  How quaint.");
	// Otherwise, return an error.	
	} else {
		printError("You can't see " + useTarget + " here.");
	}
}

// cmdUseTwo(useTargetOne,useTargetTwo): This function is activated by a double target 'use' command.
// It activates useTargetTwo's function associated with having useTargetOne used on it, if it has one.
function cmdUseTwo(useTargetOne,useTargetTwo)
{
	// To begin, all items in the player's inventory are checked to see if they might be a potential target for the USE command.
	// (The first item has to be from the inventory.)
	var firstTarget = checkInvContext(useTargetOne);
	// If it's not a valid target, abort with an error.
	if (firstTarget < 0) {
		printError("You aren't carrying " + useTargetOne + " to use.");
		return;
	}
	// Otherwise, we have a valid first target for the two-object USE command; now check for the second target.
	// To begin, all items in the room are checked to see if they might be a potential target for the USE command.
	var itemTarget = checkItemContext(useTargetTwo);
	// If the second item to USE is in the room, then we're cleared to go.
	if (itemTarget >= 0) {
		// For each contextual use command on item two:
		for (var act in roomArray[currentRoom].items[itemTarget].itemReaction)
		{
			// If that action belongs to the array and not the prototype:
			if (roomArray[currentRoom].items[itemTarget].itemReaction.hasOwnProperty(act))
			{
				// If the item required to activate this contextual command is the one we chose as the first target for the action - that function is called.
				// (It's necessary to re-get the first item's name because useTargetOne might be an alias.)
				if (act == inventory[firstTarget].ident) {
					// What an unwieldy command!
					roomArray[currentRoom].items[itemTarget].itemReaction[act](firstTarget);
					// Since this is still a USE command, it causes time to pass.
					passTime();
					return;
				}
				// Otherwise, move on to the next item in the loop.
			}
		}
		// If nothing matched, send an error and return.
		printError("You can't use those things together!");
		return;
	}
	// Otherwise, make sure there's not something in the inventory that can be used as the second USE target.
	var invTarget = checkInvContext(useTargetTwo);
	// If the item to USE is in the inventory, then again, we're clear to go.
	if (invTarget >= 0) {
		// For each contextual use command on item two:
		for (var act in inventory.items[invTarget].itemReaction)
		{
			// If that action belongs to the array and not the prototype:
			if (inventory.items[invTarget].itemReaction.hasOwnProperty(act))
			{
				// If the item required to activate this contextual command is the one we chose as the first target for the action - that function is called.
				// (It's necessary to re-get the first item's name because useTargetOne might be an alias.)
				if (act == inventory[firstTarget].ident) {
					// That's a bit better.
					inventory.items[invTarget].itemReaction[act](firstTarget);
					// Since this is still a USE command, it causes time to pass.
					passTime();
					return;
				}
				// Otherwise, move on to the next item in the loop.
			}
		}
		// If nothing matched, send an error and return.
		printError("You can't use those things together!");
		return;
	}
	// One last case: the second USE target can actually be an entity rather than an item!
	var entTarget = checkEntityContext(useTargetTwo);
	// If the entity to USE is in the inventory, then once more, we're clear to go.
	if (entTarget >= 0) {
		// For each contextual use command on the entity:
		for (var act in roomArray[currentRoom].entities[entTarget].itemReaction)
		{
			// If that action belongs to the array and not the prototype:
			if (roomArray[currentRoom].entities[entTarget].itemReaction.hasOwnProperty(act))
			{
				// If the item required to activate this contextual command is the one we chose as the first target for the action - that function is called.
				// (It's necessary to re-get the first item's name because useTargetOne might be an alias.)
				if (act == inventory[firstTarget].ident) {
					// Still an unwieldy command!
					roomArray[currentRoom].entities[entTarget].itemReaction[act](firstTarget);
					// Since this is still a USE command, it causes time to pass.
					passTime();
					return;
				}
				// Otherwise, move on to the next item in the loop.
			}
		}
		// If nothing matched, send an error and return.
		printError("You can't use that item on " + useTargetTwo + ".");
		return;
	// If we can't find it anywhere, return an error.
	} else {
		printError("You can't see " + useTargetTwo + " here.");
	}
}

// cmdTalk(talkTarget): This function is activated by a 'talk' command.  It displays the dialogue of the chosen entity. 
function cmdTalk(talkTarget)
{
	// All entities are checked to see if they're a potential target for conversation.
	var entTarget = checkEntityContext(talkTarget);
	// If the target is found, display its dialogue and pass time.
	if (entTarget >= 0) {
		lookAtDialogue(entTarget);
		passTime();
		return;
	}
	// Otherwise, check through the room's items; this is unnecessary but useful for error messages.
	var itemTarget = checkItemContext(talkTarget);
	if (itemTarget >= 0) {
		printError(talkTarget + " doesn't seem to be much for conversation.");
		return;
	}
	var invTarget = checkInvContext(talkTarget);
	if (invTarget >= 0) {
		printError(talkTarget + " doesn't seem to be much for conversation.");
		return;
	}
	// There's a special, joking use case for the "ME" aliases.
	if ((talkTarget == "SELF") || (talkTarget == "ME") || (talkTarget == "MYSELF")) {
		printError("You spend a bit talking to yourself, but quickly start feeling silly.");
		return;
	}
	// If the object just doesn't exist in any form, print an error.
	printError("You can't see " + talkTarget + " here.");
}

// getCmd(): This function runs whenever the player clicks on the "Go" button.  It parses the information in the action box and acts appropriately.
function getCmd()
{
	var abort = false; // Indicates whether to stop the processing.
	// Whenever a new command is input, the error box is cleared in preparation.
	clearError();
	// First, the text is retrieved from the player action box.
	var playerInput = document.getElementById("actionbox").value;
	// Next, the text is capitalized and split into multiple parts, based on spaces.
	var inputArray = playerInput.toUpperCase().split(' ');
	// Once finished, we clean out the field.
	document.getElementById("actionbox").value = "";
	// Right now, what we care about is what's in the first part; namely, whether it's a valid command or the beginning of one.
	// The following if/else chain describes all valid commands and handles them.
	// MOVE: This command can be any valid directional input ("W", "NW", "N", "NE", "E", "SE", "S", "SW", "IN", "OUT", "UP", and "DOWN").  It will need to be the only command.
	if ((inputArray[0] == "W") || (inputArray[0] == "NW") || (inputArray[0] == "N") || (inputArray[0] == "NE") || (inputArray[0] == "E") || (inputArray[0] == "SE")
			|| (inputArray[0] == "S") || (inputArray[0] == "SW")|| (inputArray[0] == "IN") || (inputArray[0] == "OUT") || (inputArray[0] == "UP") || (inputArray[0] == "DOWN"))
	{
		// If any extraneous commands were inserted, the player will be warned; otherwise, the function executes.
		if (inputArray.length == 1)	{ cmdMove(inputArray[0]); }
		// If that direction's invalid, print an error.
		else { printError("Only input the direction in which you want to move."); }
	// LOOK: You can LOOK at a thing (to see it instead of the room) or LOOK with no other command (to look back at the room).
	} else if (inputArray[0] == "LOOK") {
		// Delete the first input.
		inputArray.splice(0,1);
		// If the form 'LOOK AT' was used, that's identical to 'LOOK'.
		if (inputArray[0] == "AT") { inputArray.splice(0,1); }
		// Then fuse the array back into a string, getting the total input of what the player wanted to look at.
		var lookObject = inputArray.join(' ');
		// Activate the 'look' command with the thing being looked at as its input.
		cmdLook(lookObject);
	// GET: You can GET certain things, allowing you to place them into your INVENTORY.  Synonymous with TAKE.
	} else if ((inputArray[0] == "GET") || (inputArray[0] == "TAKE")) {
		// Delete the first input.
		inputArray.splice(0,1);
		// The form "GET THE" or "TAKE THE" is identical to "GET".
		if (inputArray[0] == "THE") { inputArray.splice(0,1); }
		// Then fuse the array back into a string, getting the total input of what the player wanted to get.
		var getObject = inputArray.join(' ');
		// Activate the 'get' command with the thing to take as its input.
		cmdGet(getObject);
	// USE: The most versatile command, this allows you to USE an item and activate its own unique function.
	} else if (inputArray[0] == "USE") {
		// Delete the first input.
		inputArray.splice(0,1);
		// The form "USE THE" is identical to "USE".
		if (inputArray[0] == "THE") { inputArray.splice(0,1); }
		// USE has two special forms: one that uses a single object and one that uses two.  These can be differentiated by the presence of "ON" or "WITH".
		for (var key in inputArray)
		{
			// If the key belongs to the array and not the prototype:
			if (inputArray.hasOwnProperty(key))
			{
				// If the key is one of the special terms we're looking for:
				if ((inputArray[key] == "ON") || (inputArray[key] == "WITH"))
				{
					// If the key has been located, splice the array around the phrase (which will then be removed) and join both arrays.
					var useTargetOne = inputArray.splice(0,key).join(' ');
					inputArray.splice(0,1);
					var useTargetTwo = inputArray.join(' ');
					// Call the two-target USE command.
					cmdUseTwo(useTargetOne,useTargetTwo);
					abort = true;
				}
			}
		}
		// If we couldn't find either of the USE-splitting keywords, call the command as a regular USE.
		if (!abort)
		{
			var useTarget = inputArray.join(' ');
			cmdUse(useTarget);
		}
	// ITEMS: Just lets you look at what's currently in your inventory.
	} else if ((inputArray[0] == "ITEMS") || (inputArray[0] == "INVENTORY")) {
		lookAtInventory();
	// TALK: Allows you to try and strike up conversations with the locals.
	} else if (inputArray[0] == "TALK") {
		// Delete the first input.
		inputArray.splice(0,1);
		// The form "TALK TO" is identical to "TALK".
		if (inputArray[0] == "TO") { inputArray.splice(0,1); }
		// The form "TALK THE" is identical to "TALK".  (Mostly relevant for "TALK TO THE".)
		if (inputArray[0] == "THE") { inputArray.splice(0,1); }
		// Fuse the array back into a string, getting the total input of what the player wanted to get.
		var talkObject = inputArray.join(' ');
		// Activate the 'talk' command with the thing to talk to as its input.
		cmdTalk(talkObject);	
	// HELP: This just shows you the list of commands again.
	} else if (inputArray[0] == "HELP") {
		lookAtHelp();
	} else {
		// Finally; if no valid command was input, say as much.
		printError("That's not a valid command.");	
	}
}

// getEnter(ev): Checks for the enter key when typing into the input box and uses it to submit a command.
function getEnter(ev)
{
	if ((ev.keyCode == 13) || (ev.which == 13)) { getCmd(); }
}

// ~~~~~~ ITEMS ~~~~~~
// This section of the code contains every item in the game.

itemArray[0] = new Item("GLASS DOORS",
	["DOORS"],
	"These bright, stylish glass doors lead out of the gallery.",
	"GLASS DOORS at the far end of the room lead outside.",
	false,
	true,
	function(){ printError("You and your parents just got here.  You probably shouldn't run outside on your own..."); },
	{});
itemArray[1] = new Item("ALACANDRE POSTER",
	["POSTER"],
	"The poster advertises a local exhibition featuring the work of an obscure artist named 'Gregor Alacandre'.<br>" +
	"It features a reproduction of one of his works: a spiral staircase descending into an infinite darkness.<br>",
	"A POSTER is affixed to the wall above the reception desk, featuring a somber illustration.",
	false,
	false,
	[],
	{});
itemArray[2] = new Item("QUICKSAND",
	["WALL PAINTING"],
	"In deathly hues of brown and red, the canvas depicts a young, muddy girl in tattered clothing being dragged<br>" +
	"into an open void by innumerable hands, while passerby pointedly ignore the scene before them.<br>",
	"A huge painting across one wall depicts a screaming girl dragged down by hands.  Its title is QUICKSAND.",
	false,
	false,
	[],
	{});
itemArray[3] = new Item("VORTEX",
	["FLOOR PAINTING","STAIRCASE PAINTING"],
	"A somber work in blues and blacks, a spiral staircase made of worn stone descends infinitely.<br>" +
	"It goes so far down, the end simply fades into darkness.  In fact, it's not clear that there is an end.<br>" +
	"Even though it's just a painting, looking down at it makes you feel dizzy...",
	"The canvas on the floor depicts an infinite spiral staircase into darkness.  Its title is VORTEX.",
	false,
	false,
	[],
	{});
itemArray[4] = new Item("GALAXY OF TERROR",
	["GALAXY","TERROR","PLANET PAINTING","EARTH PAINTING"],
	"In the center of the canvas, a wracked and ruined planet Earth melts slowly, dripping into black space.<br>" +
	"A few other planets are painted on the very edges, as though recoiling from the horrific sight.",
	"A striking painting on one wall depicts a melting planet Earth.  Its title is GALAXY OF TERROR.",
	false,
	false,
	[],
	{});
itemArray[5] = new Item("AN END",
	["END","HANGED MAN"],
	"A ragdoll fashioned in the likeness of a man hangs from the ceiling, suspended upside down by its ankle.<br>" +
	"It's dressed in a slightly dated men's fashion, up to a little metal wristwatch about one hand.<br>" +
	"Somehow, an utter terror has been expressed within the doll's desperate little button eyes.",
	"A crude doll hangs from the ceiling by a red rope.  A nearby placard reads AN END.",
	false,
	false,
	[],
	{});
itemArray[6] = new Item("ROSE GARDEN",
	["ROSE","GARDEN","ROSES"],
	"This small, makeshift garden is completely occupied with artificial roses, seemingly hand-crafted,<br>" +
	"in every color of the rainbow.  Upon closer inspection, their centers are cutely curved into heart shapes.",
	"An array of huge artificial roses occupies the chamber.  Its placard reads ROSE GARDEN.",
	false,
	false,
	[],
	{});
itemArray[7] = new Item("SELFIE STICK",
	["STICK"],
	"A light handheld stick designed for holding a smartphone while taking a picture of oneself.<br>" +
	"It's in a fashionable black and metallic finish, with a prong on the end for gripping things.",
	"Some litterer has carelessly left what looks like a SELFIE STICK on the ground here.",
	true,
	true,
	function(){
		if (darkMode) { printText("You hold the stick nervously out in front of you.<br>But it's far too flimsy to act as a weapon."); }
		else { printText("You pose with your selfie stick!<br>With no phone on it.<br>You promptly feel silly and put it away again."); }
	},
	{});
itemArray[8] = new Item("MISERY LOVES COMPANY",
	["MISERY","COMPANY","STATUES","SCULPTURE","OBSCENE SCULPTURE","OBSCENE STATUE","GHASTLY SCULPTURE","OBSCENE SCULPTURE"],
	"Within the center of this room cluster multiple statues of men in colored suits.  Their faces are turned inside out,<br>" +
	"pressing into their heads; if you peer enough, you can see their eyes dilated, faces twisted into an expression of<br>" +
	"utter pleasure at their shared condition.",
	"Behind the fence are sculptures with inverted faces, visages twisted in euphoria.  The placard reads MISERY LOVES COMPANY.",
	false,
	false,
	[],
	{});
itemArray[9] = new Item("LADY WITH RED NAILS",
	["LADY","RED","NAILS","LADY PORTRAIT","WOMAN PORTRAIT","LADY PAINTING"],
	"Against a shadowy background, the painting depicts a demure, smiling noblewoman with long, cascading hair.<br>" +
	"There's a knowing, mischevious look in her eyes, and one corner of her mouth turns up slightly into a little smirk.<br>" +
	"She's tightly arrayed in a fine, frilly dress, almost Victorian in nature but with concessions to modern fashion.<br>" +
	"If you look to the bottom of the painting, you can just see vicious blood-red claws hidden beneath her sleeves.<br>",
	"In the center of one wall is a painting of a beautifully dressed woman with blood-red claws.  Its title is LADY WITH RED NAILS.",
	false,
	false,
	[],
	{});
itemArray[10] = new Item("DISPLAY TABLE",
	["DISPLAY","TABLE"],
	"This display table exhibits a variety of sculptures designed with colored glass; a light shines through from beneath the table,<br>" +
	"casting rainbow patterns in all sorts of shapes across the gallery's white ceiling.<br>" +
	"Looking closer, you can see a gleaming, metallic object wedged between the display table and the wall.",
	"One DISPLAY TABLE isn't properly aligned with the wall, and sits very slightly askew.",
	false,
	true,
	function() { printText("You try to reach behind the display table and take the gleaming object, but it's just too far.<br>Your arms can't reach that far..."); },
	{"SELFIE STICK" : function() {
		printText("Sliding your selfie stick into the gap between the wall and the table, you manage to get the grip behind the gleaming object.<br>" +
			"Tugging forwards, you forcefully pull the object out from the wall, sending it skittering across the floor.");
		roomArray[10].items.push(itemArray[11]);
		itemArray[10].itemUse = function() {
			printText("There's no longer anything behind the table.");
		}
		itemArray[10].itemReaction["SELFIE STICK"] = function() {
			printText("There's no longer anything behind the table to pull out.");
		}
	}});
itemArray[11] = new Item("PALETTE KNIFE",
	["KNIFE","BLADE"],
	"A large palette knife with a blade just clear enough to gleam in a bright light.  Its wedge-like shape<br>" +
	"is meant for spreading paint, but the edge feels a bit sharper than a tool like this ought to be.",
	"There's a PALETTE KNIFE lying on the floor, strangely ominous.",
	true,
	true,
	function(){
		if (darkMode) { printText("You brandish the palette knife!  The gallery seems to almost shrink back about you."); }
		else { printText("You shouldn't swing that around carelessly.  It's pretty blunt, but you could still hurt somebody..."); }
	},
	{});
itemArray[12] = new Item("LARGE PLACARDS",
	["PLACARDS","PLACARD"],
	"The placards describe Gregor Alacandre as a morose, macabre artist of Spanish origin, who spent much of his life<br>" +
	"struggling with mental illness.  He had even spent time in an insane asylum in his early years, a traumatic<br>" +
	"experience which gave him a lifelong fear of women.<br>" +
	"He lived in poverty, working feverishly on his art and taking inspiration from anything he can,<br>" +
	"believing wholeheartedly that if he put his spirit into his work, his efforts would one day be recognized.<br>" +
	"He was ultimately proved correct, but tragically, many of his works' true value was only realized after his premature death.",
	"A number of LARGE PLACARDS are affixed to the walls, displaying information about the history of Alacandre.",
	false,
	false,
	[],
	{});
itemArray[13] = new Item("UNTITLED",
	["PAINTING","GIANT PAINTING"],
	"This massive painting, in darkest blacks and nightmarish, striking red lines, seems to depict some kind of<br>" +
	"dark art gallery.  Many of Alacandre's own works have been reproduced in miniature within, but there's no people about.<br>" +
	"For whatever reason, some of the painting's details seem eerily familiar to you.",
	"There's an enormous painting across the entire wall.  Its title is UNTITLED.",
	false,
	false,
	[],
	{});
// Dark version of placards.
itemArray[14] = new Item("LARGE PLACARDS",
	["PLACARDS","PLACARD"],
	"come down below<br>" +
	"come down below<br>" +
	"come down below<br>" +
	"come down below<br>" +
	"i want to show you something<br>",
	"A number of LARGE PLACARDS are affixed to the walls, displaying information.",
	false,
	false,
	[],
	{});
// Dark version of the piece
itemArray[15] = new Item("MISERY LOVES COMPANY",
	["MISERY","COMPANY","STATUES","SCULPTURE","OBSCENE SCULPTURE","OBSCENE STATUE","GHASTLY SCULPTURE","OBSCENE SCULPTURE"],
	"Within the center of this room cluster multiple statues of men in colored suits.  Their faces are turned inside out,<br>" +
	"pressing into their heads; if you peer enough, you can see their eyes dilated, faces twisted into an expression of<br>" +
	"utter pleasure at their shared condition.  Every so often, they let out a mindless giggle.",
	"Behind the fence are sculptures with inverted faces, eyes tracking your movements.  The placard reads MISERY LOVES COMPANY.",
	false,
	false,
	[],
	{});
// Dark version of the piece
itemArray[16] = new Item("ROSE GARDEN",
	["ROSE","GARDEN","ROSES"],
	"This small, makeshift garden is completely occupied with roses, too beautiful almost to be real.,<br>" +
	"in every color of the rainbow.  Upon closer inspection, their centers are cutely curved into heart shapes.",
	"An array of huge roses occupies the chamber.  Its placard reads ROSE GARDEN.",
	false,
	false,
	[],
	{});
// Dark version of the piece
itemArray[17] = new Item("GLASS DOORS",
	["DOORS"],
	"These glass doors lead towards an endless nothing.  Looking at it hurts your eyes.",
	"GLASS DOORS at the far end of the room lead to nothingness.",
	false,
	true,
	function(){ printText("You grab the doors' handles and pull as hard as you can, but it doesn't even budge."); },
	{});

// ~~~~~~ ENTITIES ~~~~~~
// This section of the code contains every entity in the game.

entityArray[0] = new Entity("MOTHER",
	["MOM","MOMMY"],
	"A beautiful woman with rich brown hair tightly done up into a bun, only the deep circles about her eyes betray her age.<br>" +
	"She's wearing the long, velvety black gown she keeps in a plastic bag in the closet,<br>" +
	"and rarely has brought out for very special occassions.<br>" +
	"Every now and again, she glances about the room with slight concern, making sure she knows where you are.",
	"Your MOTHER is standing at the reception desk, talking through some trivial matter with the gallery's receptionist.",
	{},
	"Yes, a party of three...<br>  Oh!  Just a moment, dear.  We'll be inside the gallery if you can wait just a bit longer!<br>" +
	"I'm sure you'll love it.  They have beautiful paintings and all sorts of wonderful things to look at...<br>" +
	"Hm?  You want to run on ahead?<br>" +
	"Oh, I suppose that's fine.  Just try not to make too much noise, or bother the other guests.",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("Your MOTHER is still carrying on a discussion with the receptionist."); }
		if (currentRoom > 3) {
			removeSelf(this.ident,this.myLocation);
			roomArray[3].entities.push(entityArray[0]);
			entityArray[0].placeText = "Your MOTHER is standing by the velvet ropes, gazing down at the painting on the floor.";
			entityArray[0].dialogue = "Hello again, dear.  Have you been enjoying the gallery?  Everything is just as lovely as I imagined.<br>" +
			"Alacandre always used such vivid colors!  The magazines really don't do his work any justice.<br>" +
			"Don't you just feel like you could fall into this painting on the floor here?";
			entityArray[0].brain = function(){ if (currentRoom == this.myLocation) { appendEntText("Your MOTHER stares into the depths of the floor painting."); } }
			entityArray[0].myLocation = 3;
		}
	},
	2);
entityArray[1] = new Entity("FATHER",
	["DAD"],
	"An awkwardly tall man with short-cropped hair and fingers worn from tireless years of administrative work.<br>" +
	"His eyes flicker about, always looking at anything and everything, yet afraid to settle on any single thing for too long.<br>" +
	"His suit is worn and tired, however much he might try to hide it through his poise.",
	"Your FATHER is standing by the reception desk, flipping through pamphlets.",
	{},
	"Oh!  Hello there.  Isn't this gallery amazing?  ...Well, heh, I suppose we haven't actually gone in yet!<br>" +
	"I'm getting excited just from reading this material.  The man's got quite the history, you know.<br>" +
	"He was one of those 'mad artist' sorts.  Always the eccentric, led a terribly difficult life...<br>" +
	"And now that he's dead, they hype him up as a misunderstood genius to paste a few zeroes on his work.<br>" +
	"Sad story, isn't it?  But he really was an incredible artist.  Seeing his work like this is a once-in-a-lifetime opportunity.",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("Your FATHER takes a pamphlet from the table and tucks it into his pocket."); }
		if (currentRoom > 3) {
			removeSelf(this.ident,this.myLocation);
			roomArray[3].entities.push(entityArray[1]);
			entityArray[1].placeText = "Your FATHER is marveling at the large painting hung up on the wall.";
			entityArray[1].dialogue = "Hello there!  Isn't this gallery amazing?  Worth the trip, certainly.<br>" +
			"This painting on the wall...  The one called 'Quicksand'.  Do you understand what the painting means?.<br>" +
			"...That's okay.  Neither do I!";
			entityArray[1].brain = function(){ if (currentRoom == this.myLocation) { appendEntText("Your FATHER remarks on some trivial tidbit within one of his pamphlets."); } }
			entityArray[1].myLocation = 3;
		}
	},
	2);
entityArray[2] = new Entity("RECEPTIONIST",
	["SECRETARY"],
	"A woman in a heavy jacket sits at the reception desk, occassionally brushing a strand of prematurely gray hair from their face.<br>" +
	"She gives an occassional, exhausted smile to passerby, seeming permanently stunned by the activity roaring through the gallery.<br>",
	"A RECEPTIONIST is seated at a desk to the side of the room.",
	{},
	"Your mother shushes you as you attempt to get the receptionist's attention.",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("The RECEPTIONIST nods once or twice, typing rapidly into their computer."); }
		if (currentRoom > 3) {
			entityArray[2].dialogue = "Oh.  Hey, kid.  Looking for your parents?<br>" +
			"They're in the room just to your right.<br>" +
			"...Maybe you aren't?  I don't know how you'd have missed them.";
			entityArray[2].brain = function(){ if (currentRoom == this.myLocation) { appendEntText("The RECEPTIONIST types rapidly into their computer."); } }
		}
	},
	2);
entityArray[3] = new Entity("RAGGED VISITOR",
	["VISITOR"],
	"Gazing upwards with worried eyes, a visitor dressed in a torn, raggedy coat stands idly, their hands in their pockets.<br>" +
	"Their hair's dyed a purplish blue, but it looks like they might have done it themselves and missed a few spots.",
	"A RAGGED VISITOR is staring up at the doll hung from the ceiling.",
	{},
	"They don't notice you trying to get their attention.  It seems they're completely absorbed in the artwork.",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("The RAGGED VISITOR just stares upwards, sadly."); }
	},
	5);
entityArray[4] = new Entity("BORED MAN",
	["BORED","MAN"],
	"A tired-looking man in a longcoat is leaning against a wall, staring wistfully out of one of the windows.<br>" +
	"They shift their gaze to follow the activity outside, yawning a bit.  They don't seem like they want to be here.",
	"A BORED MAN leans against the wall by a window.",
	{},
	"They look over at you for a moment as you try to get their attention, but turn back to the window, ignoring you.",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("The BORED MAN shuffles and makes tired noises."); }
	},
	7);
entityArray[5] = new Entity("SCHOLARLY MAN",
	["SCHOLAR","MAN"],
	"A man with a short-cropped haircut, thick glasses, and a smart tweed jacket is walking happily around the room,<br>" +
	"carefully examining the various statues and writing absentmindedly in a tiny notepad with cute animal designs on<br>" +
	"the pages.  He's deeply absorbed in what seems to be his studies.",
	"A SCHOLARLY MAN gazes at the statues in fascination, jotting down notes on a little pad.",
	{},
	"Why, hello there, little lady!  Let me guess.  You're fascinated by the great Gregor Alacandre's works too, hm?<br>" +
	"It's never too early to develop an appreciation for the fine arts, as far as I'm concerned.<br>" +
	"This work, the one called 'Misery Loves Company'...  it's beautiful, don't you agree?<br>" +
	"The detail in the statues' contorted faces is utterly terrifying, but I can't bring myself to look away.<br>" +
	"I've come to believe this sculpture must have been fashioned after businessmen with whom Alacandre was acquainted.<br>" +
	"The piece's meaning...  is that even when their situation is unimaginably banal and crushing, men would rather<br>" +
	"surround themselves with like-minded people and delude themselves into enjoying their own lives, than take a<br>" +
	"genuine effort to improve themselves.  Don't you think?",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("The SCHOLARLY MAN paces around the room, admiring the statues' handiwork."); }
	},
	8);
entityArray[6] = new Entity("TALL WOMAN",
	["TALL","WOMAN"],
	"An exceptionally tall woman, with a brightly colored one-piece dress and skin nearly pitch black, is gazing at<br>" +
	"the paintings with a thoughtful expression on her face.  Every once in a while, she gracefully shifts her weight,<br>" +
	"body moving with a practiced ease.  Her curly hair's decorated with a lovely flower-like ornament.",
	"There's a TALL WOMAN admiring the painting of the clawed lady.",
	{},
	"Hm.  Oh, hello down there!  It's a pleasure to meet you, young lady.<br>" +
	"Tell me, what do you think of this painting?  The one with the woman that has red claws?<br>" +
	"Alacandre was a true gynophobe.  He didn't hate women.  He just found women terrifying.<br>" +
	"This painting was meant to express that terror, and help the viewer understand his irrational paranoia.<br>" +
	"But, personally?  I think the monstrous features complement the figure's beauty.<br>" +
	"Hm.  Do you think the piece was based on a real person?",
	function() {
		if (currentRoom == this.myLocation) { appendEntText("The TALL WOMAN walks about the room, stretching her legs."); }
	},
	9);
entityArray[7] = new Entity("CONTROLLER",
	[],
	"",
	"",
	{},
	"",
	function() {
		if (currentRoom > 12) {
			darkMode = true;
			document.querySelector("body").style.color = "white";
			document.querySelector("body").style.backgroundColor = "black";
			appendEntText("Suddenly, the lights flicker and go out, plunging the gallery into darkness.");
			yourAppearance[0] = "You're a young girl of about seven or eight, with fearful but determined eyes beneath long brown tresses."
			entityArray[7].brain = function() {}
		}
	},
	0);
entityArray[8] = new Entity("LADY WITH RED NAILS",
	["LADY","RED","NAILS","LADY PORTRAIT","WOMAN PORTRAIT","LADY PAINTING"],
	"A frantic noblewoman with long hair cascading over her shoulders and a massive grin is halfway out of a painting frame,<br>" +
	"digging her lethal blood-red claws into the ground and dragging her body forwards.<br>" +
	"She's tightly arrayed in a fine, frilly dress, almost Victorian in nature but with concessions to modern fashion.<br>" +
	"Her body is completely made of thick paint, and as you look at her, she stares into your eyes with pure animal excitement.",
	"The LADY WITH RED NAILS digs her claws into the ground and tenses up, preparing to strike.",
	// Combat!
	{"PALETTE KNIFE": function() {
		if (enemyHP > 0)
		{
			playAudio(soundArray[3],0,2);
			enemyHP -= 1;
			switch(enemyHP) {
				case 4:
					printText("Drawing your blade, you dash forwards and hack at the Lady with Red Nails' arms, your knuckles completely white<br>" +
						"as a mad strength you never knew you had drives you on.  The blade sinks straight through her semisolid body, slashing into<br>" +
						"her arms and shoulders with a violent spray of red paint; she claws at you as you retreat, but the damage is done.");
					entityArray[8].descText = "A frantic noblewoman with long hair cascading over her shoulders and a massive grin is halfway out of a painting frame,<br>" +
						"digging her lethal blood-red claws into the ground and dragging her body forwards.<br>" +
						"She's tightly arrayed in a fine, frilly dress, stained with red paint.<br>" +
						"Her body is completely made of thick paint, and slashed open from your attacks; red paint drools from the openings.";
					break;
				case 3:
					printText("Drawing your blade, you dash forwards and slash through the Lady with Red Nails' body, a berserker fury<br>" +
						"driving your weapon across her chest, through her face - any surface your knife can reach, you cut through.<br>" +
						"Letting out an inhuman scream, she drives her claws through you in return, frantically trading blows.");
					entityArray[8].descText = "A frantic noblewoman with long hair cascading over her shoulders and a massive grin is halfway out of a painting frame,<br>" +
						"digging her lethal blood-red claws into the ground and dragging her body forwards.<br>" +
						"She's tightly arrayed in a fine, frilly dress, cut through and stained with red paint.<br>" +
						"Her body is completely made of thick paint, and slashed badly from your attacks; red paint drools from the openings.";
					break;
				case 2:
					// At this point, the Lady with Red Nails is completely disabled.
					printText("Drawing your blade, you dash forwards and strike out with frightening speed, your body forced into responding.<br>" +
						"The Lady with Red Nails furiously claws at you, tearing through your body, but your knife raises and you cut straight through her claws.<br>" +
						"Stepping forwards, you sever her arms, completely immobilizing her.");
					entityArray[8].descText = "A frantic noblewoman with long hair cascading over her shoulders and a horrific maw is halfway out of a painting frame,<br>" +
						"struggling in place as she lets out cries of pain and rage, red paint streaming from her eyes and mixing with the white.<br>" +
						"Her fine, frilly dress is ruined, soaked a pure red and rended from the ferocity of your blows.<br>" +
						"Her body is completely made of thick paint, and slashed open from your attacks; red paint cascades from the stumps where arms once were.";
					entityArray[8].placeText = "The LADY WITH RED NAILS is splayed out helplessly upon the ground.";
					entityArray[8].dialogue = "All she can do is scream.";
					entityArray[8].brain = function() {
						if (currentRoom == this.myLocation) { appendEntText("The LADY WITH RED NAILS writhes helplessly, screaming in pain."); }
					}
					break;
				case 1:
					printText("Drawing your blade, you hack and slash at the helpless painting, tears flooding your eyes as you viciously rip into<br>" +
						"her body, driving your blade down into her head.  After what feels like hours, you realize what you've been doing and slowly back away.");
					entityArray[8].descText = "A frantic, mauled noblewoman is halfway out of a painting frame,<br>" +
						"struggling in place as she lets out unidentifiable noises, pinkish paint streaming down her body.<br>" +
						"Her body is completely made of thick paint, and nearly destroyed from your assault.<br>";
					break;
				default:
					// If you got here, good job!  Enjoy your bad ending.
					printText("Drawing your blade, you drive it through what remains of the Lady with Red Nails' body, wielding edge and flat<br>" +
						"in tandem, obliterating your former assailant piece by piece.  You lose track of time, but eventually, you're finished.<br>" +
						"For some reason, you can't stop smiling.");
					yourAppearance[0] = "You're a young girl of about seven or eight, with bright eyes beneath long brown tresses and a constant placid smile.";
					darkEnding = true;
					entityArray[8].descText = "Judging from the stained frame, this featureless lump of paint must have been a painting at some point.";
					entityArray[8].placeText = "The LADY WITH RED NAILS is splattered onto the ground.";
					entityArray[8].dialogue = "Silence.";
					entityArray[8].brain = function() { }
					break;
			}
		} else {
			printText("There's nothing left to slash.");
		}
	}},
	"As you try to talk to her, the Lady's mouth splits into a wicked grin; she leaps forward and attacks while you're vulnerable.",
	// HERE WE GO
	function() {
		// The Lady in Red activates in dark mode.
		if (darkMode) {
			// When the Lady activates, a sound is played to warn of it.
			playAudio(soundArray[0],0,1);
			// Actual AI is here.
			entityArray[8].brain = function()
			{
				// If the player is currently in the same room as the Lady in Red, she'll attack.
				if (currentRoom == this.myLocation) {
					playAudio(soundArray[2],0,1);
					damagePlayer();
					// Attack animation changes based on HP.
					switch(yourHP)
					{
						case 4:
							appendEntText("<div style='color:red'>The Lady with Red Nails lunges forwards and sinks her claws into your shoulder, ripping through meat and muscle.<br>" +
								"A momentary shock passes through your body, then a sudden unbearable pain; you blindly stumble backwards and away.<br>" +
								"Rearing back, she prepares to pounce again.</div>");
							break;
						case 3:
							appendEntText("<div style='color:red'>The Lady with Red Nails hurls herself towards you, her claws outstretched, reaching for vulnerable flesh.<br>" +
								"Before you can react, they sink into the soft meat of your abdomen and rip across, tearing a horrific gash through your form.<br>" +
								"You barely manage to leap away before she can strike a vital point.<div>");
							break;
						case 2:
							appendEntText("<div style='color:red'>The Lady with Red Nails propels herself low across the floor this time, aiming for your legs.<br>" +
								"Unprepared for the low attack, you stumble, her claws slashing in a storm of movement through any exposed parts they find.<br>" +
								"Hitting the ground hard, you roll away and force yourself back onto your feet.</div>");
							break;
						case 1:
							appendEntText("<div style='color:red'>The Lady with Red Nails takes a flying leap towards you, claws bared for a final attack.<br>" +
								"Somehow, you manage to make your body respond, arms raising protectively in front of you as you stagger backwards.<br>" +
								"A storm of claw-swipes blows across you, unimaginable pain striking through your form.<br>" +
								"But you just barely manage to keep the absolutely necessary parts of your body intact.</div>");
							break;
						default:
							appendEntText("<div style='color:red'>The Lady with Red Nails deals a final, decisive blow.</div>");
							break;
					}
				// If the Lady with Red Nails is *not* currently in the player's room, she'll try to stalk them into their room.
				} else {
					// Find the next room to move to and the distance to it.
					var movePath = findShortestPath(this.myLocation,currentRoom,galleryMapDark);
					// Remove the entity from its current room.
					removeSelf(this.ident,this.myLocation);
					// Then move it to its new room.
					playAudio(soundArray[1],movePath[1],1);
					roomArray[movePath[0]].entities.push(entityArray[8]);
					entityArray[8].myLocation = movePath[0];
					// If the Lady with Red Nails just entered the player's room, a message is shown warning of it.
					// There are three messages, generated randomly.
					if (currentRoom == this.myLocation) {
						var rng = Math.floor(Math.random() * (3 - 1)) + 1;
						switch (rng)
						{
							case 1:
								appendEntText("The LADY WITH RED NAILS drags herself rapidly towards you, her claws inching closer and closer.");	
								break;
							case 2:
								appendEntText("The LADY WITH RED NAILS chases you into the room, lips slightly parted in anticipation of blood.");	
								break;
							default:
								appendEntText("The LADY WITH RED NAILS claws her way into the room; she catches sight of you and rapidly closes in.");	
						}
					}
				}
			}
		}
	},
	15);
entityArray[9] = new Entity("ENDING",
	[],
	"",
	"",
	{},
	"",
	function() {
		if (currentRoom == this.myLocation) {
			if (darkEnding) {
				window.location.href = "resources/EndB.html";
			} else {
				window.location.href = "resources/EndA.html";
			
			}
		}
	},
	25);

// ~~~~~~ ROOMS ~~~~~~
// This section of the code contains every room in the game.

roomArray[0] = new Room(0,
	"Welcome to debug zone.",
	[],
	[entityArray[7]],
	{});
roomArray[1] = new Room(1,
	"LOST IN GALLERY<br>" +
	"a game by Colin Mart<br>" +
	"inspired by 'Ib'<br>" +
	"<br>Not intended for children or those of a nervous disposition<br>" +
	"<br>Commands:<br>" +
	"DIRECTION: Move in that direction.  (For example: N means go North.)<br>" +
	"LOOK X: Look at object X.  (For example: LOOK CHAIR to look at CHAIR.)  <i>(This works on objects in your inventory.)</i><br>" +
	"GET X: Get object X, if you can.  (For example: GET PEN to get a PEN.)<br>" +
	"USE X: Use object X, if you can.  (For example: USE PEN to use a PEN.)  <i>(This works on objects in your inventory.)</i><br>" +
	"USE X ON Y: Use object X from your inventory on object Y in the environment.  (For example: USE PEN ON PAPER.)<br>" +
	"ITEMS: Look at what you're currently carrying.<br>" +
	"TALK X: Try to strike up a conversation with person X.<br>" +
	"HELP: See the list of commands again.<br>" +
	"<i>Commands are case insensitive.</i><br>" +
	"<br>Type IN to begin.",
	[],
	[],
	{"IN": 2});
roomArray[2] = new Room(2,
	"The gallery's reception room is a spartan, white chamber with a hard wooden floor, every inch illuminated by glowing lights<br>" +
	"that seem to fade into the ceiling.  Looking through the glass doors, you can see the city's constant activity rushing by;<br>" +
	"on the other side of the threshold lies the gallery proper, an expertly arranged stream of rooms filled with<br>" +
	"all manner of bizarre works.",
	[itemArray[0],itemArray[1]],
	[entityArray[0],entityArray[1],entityArray[2]],
	{"E": 3});
roomArray[3] = new Room(3,
	"This spacious chamber's floor is nearly consumed by a massive artwork laid out flat along its center, surrounded by ropes.<br>." +
	"A pathway is laid out around it, allowing visitors to pass through the room and examine the only slightly smaller canvases<br>" +
	"laid out along the walls.  A gentle murmur comes up from the mostly silent spectators crowded around the paintings.",
	[itemArray[2],itemArray[3]],
	[],
	{"W": 2, "NE": 4, "SE": 5});
roomArray[4] = new Room(4,
	"A V-shaped corridor connects the main chamber with a smaller chamber to the east, split in two by a tall, even staircase<br>" +
	"that twists upwards towards the gallery's second floor.  Various small paintings line the walls, and a visitor walks by<br>" +
	"every now and again, marveling at some canvas or another.",
	[itemArray[4]],
	[],
	{"SW": 3, "SE": 6, "UP": 7});
roomArray[5] = new Room(5,
	"A V-shaped corridor connects the main chamber with a smaller chamber to the east.<br>" +
	"Several small paintings line the walls, along with hooks and similar fixtures on the ceiling, one of which holds a piece.",
	[itemArray[5]],
	[entityArray[3]],
	{"NW": 3, "NE": 6});
roomArray[6] = new Room(6,
	"This smaller chamber seems to be allocated for works of sculpture too heavy or cumbersome to move upstairs.<br>" +
	"A few mannequins and ceramic bunnies line the walls, and in the center of the chamber is an artificial rose garden.<br>" +
	"The management even scented this room with roses, to complement the illusion.",
	[itemArray[6],itemArray[7]],
	[],
	{"NW": 4, "SW": 5});
roomArray[7] = new Room(7,
	"The top of the staircase contains no artworks; it's simply a transistory space between the two floors of the gallery.<br>" +
	"Two windows at the top of the stairs allow natural light to stream into the room, giving a lovely view of the city below.<br>",
	[],
	[entityArray[4]],
	{"E": 8, "DOWN": 4});
roomArray[8] = new Room(8,
	"This chamber is split into walkways by a metal fencing, splitting off the visitors from several displays of abstract,<br>" +
	"ghastly sculptures.  An occassional visitor gawks at the sight as they walk by.  You feel like your parents might have<br>" +
	"objected to your going alone if they knew this was up here.",
	[itemArray[8]],
	[entityArray[5]],
	{"W": 7, "S": 10, "E": 9});
roomArray[9] = new Room(9,
	"Paintings in ornamental frames line the walls in this corner of the gallery, depicting a variety of life-like scenes;<br>" +
	"you can make out a still life in one corner, and just a few paintings to the right, a woman shushing her child as they<br>" +
	"enthusiastically admire a painting of a cat.  The floor is bare, and the chamber comfortably airy.",
	[itemArray[9]],
	[entityArray[6]],
	{"W": 8, "S": 11});
roomArray[10] = new Room(10,
	"This L-shaped corridor leads around to the eastern side of the gallery's second floor.<br>" +
	"The walls are lined with display tables, upon which rest a variety of small abstract sculptures.",
	[itemArray[10]],
	[],
	{"N": 8, "E": 12});
roomArray[11] = new Room(11,
	"This L-shaped corridor leads around to the western side of the gallery's second floor.<br>" +
	"This room's seemingly dedicated to Alacandre's history; there's numerous paintings with drastically differing<br>" +
	"styles, separated by huge placards.",
	[itemArray[12]],
	[],
	{"N": 9, "W": 12});
roomArray[12] = new Room(12,
	"This connecting corridor is completely empty except for a single, huge painting.<br>" +
	"As you enter, the gentle sounds of visitors moving about fade completely.",
	[itemArray[13]],
	[],
	{"W": 17, "E": 14});
// Dark version of room 12
roomArray[13] = new Room(13,
	"This connecting corridor is completely empty except for a single, huge painting.<br>" +
	"Paint slowly but steadily drips from behind the painting.",
	[itemArray[13]],
	[],
	{"W": 17, "E": 14});
// Dark version of room 10
roomArray[14] = new Room(14,
	"This L-shaped corridor leads around to the western side of the gallery's second floor.<br>" +
	"This room's seemingly dedicated to Alacandre's history; there's numerous paintings with drastically differing<br>" +
	"styles, separated by huge placards.",
	[itemArray[14]],
	[],
	{"N": 15, "W": 13});
// Dark version of room 9
roomArray[15] = new Room(15,
	"Paintings in ornamental frames line the walls in this corner of the gallery, depicting a variety of life-like scenes;<br>" +
	"you can make out a still life in one corner, and a few paintings to the right, a painting of a cat, meowing planitively.<br>" +
	"The floor is bare, the air still and cold.<br>" +
	"The painting of the woman with claws is missing from the wall.",
	[],
	[entityArray[8]],
	{"W": 16, "S": 14});
// Dark version of room 8
roomArray[16] = new Room(16,
	"This chamber is split into walkways by a metal fencing, splitting off the visitors from several displays of abstract,<br>" +
	"ghastly sculptures.",
	[itemArray[15]],
	[],
	{"W": 18, "S": 17, "E": 15});
// Dark version of room 11
roomArray[17] = new Room(17,
	"This L-shaped corridor leads around to the eastern side of the gallery's second floor.<br>" +
	"The walls are lined with display tables, upon which rest a variety of small abstract sculptures.",
	[],
	[],
	{"N": 16, "E": 13});
// Dark version of room 7
roomArray[18] = new Room(18,
	"The top of the staircase contains no artworks; it's simply a transistory space between the two floors of the gallery.<br>" +
	"Two windows at the top of the stairs open onto nothingness, their outsides dripping with a thick liquid.<br>",
	[],
	[],
	{"E": 16, "DOWN": 19});
// Dark version of room 4
roomArray[19] = new Room(19,
	"A V-shaped corridor connects the main chamber with a smaller chamber to the east, split in two by a tall, even staircase<br>" +
	"that twists upwards towards the gallery's second floor.  Various small paintings line the walls.",
	[itemArray[4]],
	[],
	{"SW": 22, "SE": 20, "UP": 18});
// Dark version of room 6
roomArray[20] = new Room(20,
	"This smaller chamber seems to be allocated for works of sculpture too heavy or cumbersome to move upstairs.<br>" +
	"A few mannequins and ceramic bunnies line the walls, and in the center of the chamber is a rose garden.<br>" +
	"The scent of roses emanates from the garden.",
	[itemArray[16]],
	[],
	{"NW": 19, "SW": 21});
// Dark version of room 5
roomArray[21] = new Room(21,
	"A V-shaped corridor connects the main chamber with a smaller chamber to the east.<br>" +
	"Several small paintings line the walls, along with hooks and similar fixtures on the ceiling.<br>" +
	"Innumerable sickeningly lifelike dolls hang from the ceiling, bodies pierced through hooks.",
	[],
	[],
	{"NW": 22, "NE": 20});
// Dark version of room 3
roomArray[22] = new Room(22,
	"This spacious chamber's floor has a massive hole in it, an abyss seemingly without end.  You can't see the bottom of it.<br>" +
	"A spiral staircase twirls away into infinity, its ragged stone steps leading down towards an unknown destination.<br>" +
	"There's enough room around the hole to walk around it and traverse the chamber.",
	[itemArray[2]],
	[],
	{"W": 23, "NE": 19, "SE": 21, "DOWN": 24});
// Dark version of room 2
roomArray[23] = new Room(23,
	"The gallery's reception room is a spartan, white chamber with a hard wooden floor, cast into shadow.<br>" +
	"There's nothing in the room but a poster and an empty desk.<br>" +
	"Looking through the glass doors, you can't see anything at all.<br>",
	[itemArray[17]],
	[],
	{"E": 22});
roomArray[24] = new Room(24,
	"A dizzying abyss spirals out below you, cold blue stone leading towards a still unseeable destination.<br>" +
	"There's nothing here but a stone spiral stair, lacking anything that could be described as a safety railing.",
	[],
	[],
	{"UP": 23, "DOWN": 25});
// Making it here ends the game.
roomArray[25] = new Room(25,
	"The stairs go on and on...",
	[],
	[entityArray[9]],
	{});

// ~~~~~~ CODE BODY ~~~~~~

// This command simply notes that the game is booting up.
console.log("Game is executing...");
// Starts the game proper by sending the player into the first room.
goToRoom(currentRoom);