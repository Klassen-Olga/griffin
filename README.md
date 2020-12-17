# IT-Projekt - Griffin

### WebRTC Video Conference Tool

## Überblick
- Frontend: ejs- Seiten mit JavaScript
- Backend: node,js express App
- Datenbank: mySQL auf XAMPP
- Externe Server: KMS, STUN, TURN

## Installation
### Benötigte Software:
- Node (>= v12)
- NPM (>= v6)
- Kurento Media Server
- STUN, TURN Server

```sh
# App installieren
    git clone https://github.com/Klassen-Olga/griffin.git

# Ins Verzeichnis wechseln
	cd griffin

# NPM-Abhängigkeiten installieren
	npm install

# Bower und Bower-Abhängigkeiten installieren
	npm install -g bower
	bower install

#	Docker installieren
	docker https://docs.docker.com/docker-for-windows/install/

#	Kurento Media Server installieren
	docker pull kurento/kurento-media-server:latest

#	Kurento Media Server starten
	docker run --rm -p 8888:8888/tcp -p 5000-5050:5000-5050/udp -e KMS_MIN_PORT=5000 -e KMS_MAX_PORT=5050 kurento/kurento-media-server:latest

#	STUN und TURN Server auf dem Server mit öffentlichen IP installieren
	https://github.com/coturn/coturn
```
### Weitere Anpassungen

* In der Config-Datei **/config/config.js** folgende Eigenschaften anpassen:
	
    * **kurentoMediaServerUrl** - URL von KMS
    * **serverUrl**-              URL von App
    * **stunServer**-             ```url: stun:<URL>:<Portnummer>``` <br/>
    * **turnServer**-             ```url: <IP>:<Portnummer>``` <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  ```username```: TURN-Benutzername <br/> &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;  ```credentials```: TURN-Credentials 
*	MySQL-Server oder XAMPP installieren

*	In der Datenbank-Datei **/config/database.js** folgende Eigenschaften anpassen:
	* ```username```- für Datenbankbenutzername
	* ```password```- für Datenbankpassword
	* ```database```- für Name der Datenbank
	* ```host```- für Datenbankhostname
	* ```port```- für Portnummer, auf welcher die Datenbank läuft
```sh
# Im Terminal ausführen
npx sequelize-cli db:migrate
```

## Funktionalitäten
*	Login- und Registersystem
*	Konferenzraumsystem
*	Video- und Audio Streaming
*	Chatten privat und öffentlich
*	Moderatorfunktion
*	Verwendung von Cron- Job- Das Aufräumen aller Daten, nachdem der Raum nicht mehr benutzt wird.

