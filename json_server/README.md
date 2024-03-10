# JSON Server persistency layer
This is a quick database to make certain state of certain React components persistent.
The long-term persistency layer solution needs more thoughts.

## Run and play

### Install and start the server
```
% npm install -g json-server

% npx json-server --watch items.json --port 8000
--watch/-w can be omitted, JSON Server 1+ watches for file changes by default
JSON Server started on PORT :8000
Press CTRL-C to stop
Watching items.json...

♡( ◡‿◡ )

Index:
http://localhost:8000/

Static files:
Serving ./public directory if it exists

Endpoints:
http://localhost:8000/items
```

### Get items
```
curl http://localhost:8000/queues/4153459b-4080-49ac-815a-f5ba7274ccd8
```

### Create new item (deprecated)
```
curl -H 'Content-Type: application/json' \
-d '{ "description":"This is a test description","link":"https://github.com", "id": "64e34701-4ecc-4559-8844-c53c50c11ccd", "created_time": 1710041136333, "priorityId": "important_doable"}' \
-X POST \
http://localhost:8000/items
```

### Update item
```
curl -H 'Content-Type: application/json' \
-d '{"id": "4153459b-4080-49ac-815a-f5ba7274ccd8", "name": "My testing queue", "items": [  { "id": "xasjkad701-4ecc-4559-8844-c53c50c11ccd", "description": "yes, it is working!!! updated!!!", "link": "https://github.com", "created_time": 1710040522800, "priorityId": "important_doable"  },  { "id": "695a93ca-a4b3-4493-a07a-03f6cd25c5d8", "description": "hahaha another item added from ui", "link": "hewkuwqeohwqjodenqw", "created_time": 1710041136333, "priorityId": "moon_shooting"}]}' \
-X PUT \
http://localhost:8000/queues/4153459b-4080-49ac-815a-f5ba7274ccd8
```

### Delete item (deprecated)
Note:
- The item object needs to have `id`
- When mutiple items have the same `id`, it only deletes one of them

```
curl --request DELETE http://localhost:8000/items/64e34701-4ecc-4559-8844-c53c50c11ccd
```
