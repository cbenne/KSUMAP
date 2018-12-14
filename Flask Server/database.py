import csv
import os
import sqlite3
import difflib

# A class to make it easier to dynamically pass objects back
class SearchResult:
    def __init__(self,node,level,building,node_name,building_name,x,y):
        self.node = node
        self.level = level
        self.building = building
        self.node_name = node_name
        self.building_name = building_name
        self.x = x
        self.y = y
    
    def __str__(self):
        return "%s %s" % (self.building_name, self.node_name)

class database:
    def init_db(self):
        cur = self.db.cursor()
        cur.execute('''CREATE TABLE nodes (
            ID INTEGER,
            X REAL,
            Y INTEGER,
            BUILDING INTEGER,
            LEVEL INTEGER)''')
        cur.execute('''CREATE TABLE node_alias (
            NAME TEXT,
            ID INTEGER,
            BUILDING INTEGER,
            LEVEL INTEGER,
            FRONTNAME TEXT)''')
        cur.execute('''CREATE TABLE buildings (
            ID INTEGER,
            NAME TEXT,
            LEVELS INTEGER)''')
        cur.execute('''CREATE TABLE building_alias (
            NAME TEXT,
            ID INTEGER)''')
        cur.execute('''CREATE TABLE levels (
            ID INTEGER,
            BUILDING INTEGER)''')
        cur.execute('''CREATE TABLE overlay (
            x REAL,
            y REAL,
            image TEXT,
            text TEXT,
            width REAL,
            building INTEGER,
            level INTEGER)''')
        self.db.commit()

    def populate_db(self):
        dirname = os.path.dirname(__file__)
        cur = self.db.cursor()
        with open(os.path.join(dirname,"db/nodes.csv")) as csvfile:
            rdr = csv.reader(csvfile)
            next(rdr,None)
            cur.executemany('''
                INSERT INTO nodes (ID, X, Y, BUILDING, LEVEL)
                VALUES (?,?,?,?,?)''', rdr)
        with open(os.path.join(dirname,"db/node_alias.csv")) as csvfile:
            rdr = csv.reader(csvfile)
            next(rdr,None)
            cur.executemany('''
                INSERT INTO node_alias (NAME, ID, BUILDING, LEVEL, FRONTNAME)
                VALUES (?,?,?,?,?)''', rdr)
        with open(os.path.join(dirname,"db/buildings.csv")) as csvfile:
            rdr = csv.reader(csvfile)
            next(rdr,None)
            cur.executemany('''
                INSERT INTO buildings (ID, NAME, LEVELS)
                VALUES (?,?,?)''', rdr)
        with open(os.path.join(dirname,"db/building_alias.csv")) as csvfile:
            rdr = csv.reader(csvfile)
            next(rdr,None)
            cur.executemany('''
                INSERT INTO building_alias (NAME, ID)
                VALUES (?,?)''', rdr)
        with open(os.path.join(dirname,"db/levels.csv")) as csvfile:
            rdr = csv.reader(csvfile)
            next(rdr,None)
            cur.executemany('''
                INSERT INTO levels (ID, BUILDING)
                VALUES (?,?)''', rdr)
        with open(os.path.join(dirname,"db/overlay.csv")) as csvfile:
            rdr = csv.reader(csvfile)
            next(rdr,None)
            cur.executemany('''
                INSERT INTO overlay (X,Y,IMAGE,TEXT,WIDTH,BUILDING,LEVEL)
                VALUES (?,?,?,?,?,?,?)''', rdr)
        self.db.commit()


    def search_node(self,term):
        cur = self.db.cursor()
        query = "select ID, NAME from building_alias"
        cur.execute(query)
        rows = cur.fetchall()
        maxratio = -1
        building = 0
        building_name = ''
        level = 0
        node = 0
        node_name = ''
        result_type = "not found"
        for row in rows:
            ratio = difflib.SequenceMatcher(None, str.upper(row[1].encode('ascii','ignore')),str.upper(term)).ratio()
            if ratio > maxratio:
                maxratio = ratio
                building = row[0]
                building_name = row[1]
        query = "select ID, LEVEL, NAME, FRONTNAME from node_alias where BUILDING = " + str(building)
        cur.execute(query)
        rows = cur.fetchall()
        maxratio = -1
        for row in rows:
            ratio = difflib.SequenceMatcher(None, str.upper(row[2].encode('ascii','ignore')), str.upper(term)).ratio()
            if ratio > maxratio:
                maxratio = ratio
                node = row[0]
                level = row[1]
                node_name = row[2]
                result_type = "point"
                if row[3] == "none":
                    building_name = ""
                elif row[3]:
                    building_name = row[3] 
        
        query = "select X, Y from nodes where BUILDING = " + str(building) + " and LEVEL = " + str(level) + " and ID = " + str(node)
        cur.execute(query)
        row = cur.fetchone()
        if row:
            found_x = row[0]
            found_y = row[1]
        else:
            found_x = 0.5
            found_y = 0.5
        
        query = "select x, y, IMAGE, TEXT, WIDTH from overlay where BUILDING = " + str(building) + " and LEVEL = " + str(level)
        cur.execute(query)
        rows = cur.fetchall()
        maxratio = -1
        elements = []
        for row in rows:
            elements.append({
                "x": row[0],
                "y": row[1],
                "IMAGE": row[2],
                "TEXT": row[3],
                "WIDTH": row[4]
            })
        return {
            "point": {
                "node": node,
                "level": level,
                "building": building,
                "node_name": node_name,
                "building_name": building_name,
                "x": found_x,
                "y": found_y,
                "type": result_type
            },
            "elements": elements
        }
    
    def getLevels(self,building):
        cur = self.db.cursor()
        query = "select ID from levels where BUILDING = " + building
        cur.execute(query)
        rows = cur.fetchall()
        levels = []
        for row in rows:
            levels.append({
                "id": row[0]
            })
        return levels

    def autocompleteItems(self):
        cur = self.db.cursor()
        query = "select a.NAME, c.NAME, a.LEVEL from node_alias as a left join buildings as c on a.BUILDING = c.ID where a.FRONTNAME NOT NULL and a.FRONTNAME = 'none'"
        cur.execute(query)
        rows = cur.fetchall()
        suggestions = []
        for row in rows:
            suggestions.append({
                "word": row[0],
                "building": row[1],
                "level": row[2]
            })
        return suggestions

    def __init__(self):
        self.db = sqlite3.connect(':memory:', check_same_thread=False)
        self.init_db()
        self.populate_db()
