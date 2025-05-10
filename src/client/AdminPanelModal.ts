// AdminPanelModal.ts
import { Transport } from "./Transport";
import { Player } from "../core/Schemas";

export class AdminPanelModal extends HTMLElement {
 private modal: HTMLDivElement;
 private content: HTMLDivElement;

 constructor() {
 super();
 this.modal = document.createElement("div");
 this.modal.className = "modal-background";
 this.modal.style.cssText = `
 position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
 background: rgba(0,0,0,0.5); z-index: 1000; display: none;
 `;
 this.content = document.createElement("div");
 this.content.className = "modal-content";
 this.content.style.cssText = `
 position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
 background: white; padding: 20px; border-radius: 8px; max-width: 400px;
 `;
 this.modal.appendChild(this.content);
 this.modal.addEventListener("click", (e) => {
 if (e.target === this.modal) this.close();
 });
 this.appendChild(this.modal);
 }

 open(players: Player[], myClientID: string, transport: Transport) {
 this.content.innerHTML = "";
 const title = document.createElement("h2");
 title.textContent = "Admin Panel";
 this.content.appendChild(title);

 players.forEach((player) => {
 if (player.clientID !== myClientID) {
 const playerDiv = document.createElement("div");
 playerDiv.style.cssText = "display: flex; justify-content: space-between; margin: 10px 0;";
 playerDiv.textContent = player.username || `Player ${player.clientID}`;
 
 const kickButton = document.createElement("button");
 kickButton.textContent = "Kick";
 kickButton.style.cssText = "background: #ff4444; color: white; border: none; padding: 5px 10px; cursor: pointer;";
 kickButton.addEventListener("click", () => {
 const jwtToken = localStorage.getItem("token");
 if (!jwtToken) {
 alert("You are not logged in.");
 return;
 }
 if (confirm(`Are you sure you want to kick ${player.username || player.clientID}?`)) {
 transport.sendMsg(JSON.stringify({
 type: "kick_player",
 gameID: transport.lobbyConfig.gameID,
 clientID: transport.lobbyConfig.clientID,
 persistentID: transport.lobbyConfig.persistentID,
 targetClientID: player.clientID,
 jwtToken,
 }));
 }
 });
 playerDiv.appendChild(kickButton);
 this.content.appendChild(playerDiv);
 }
 });

 const closeButton = document.createElement("button");
 closeButton.textContent = "Close";
 closeButton.style.cssText = "margin-top: 10px; width: 100%; padding: 10px; background: #0075ff; color: white; border: none; cursor: pointer;";
 closeButton.addEventListener("click", () => this.close());
 this.content.appendChild(closeButton);

 this.modal.style.display = "block";
 }

 close() {
 this.modal.style.display = "none";
 }
}

customElements.define("admin-panel-modal", AdminPanelModal);