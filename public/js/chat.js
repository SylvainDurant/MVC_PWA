let socket = io();

let message = document.getElementById("messages");
let form = document.getElementById('form');
let input = document.getElementById('input');

form.addEventListener('submit', function(e) {
e.preventDefault();
if (input.value) {
    socket.emit('chat message', input.value);
    input.value = '';
}
});

socket.on("chat message", (msg) => {
createMessage(msg);
});

const createMessage = (msg, user) => {
let item = document.createElement("li");
item.textContent = msg;
if (user === "me") {
    item.style.backgroundColor = "green"
}
message.appendChild(item);
window.scrollTo(0, document.body.scrollHeight);
}