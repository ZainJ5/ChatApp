function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

const token = getCookie('Token');

const socket = io(window.location.origin, {
  auth: {
    token: token
  }
});

socket.on('Total-client', (users) => {
  console.log(`Total users are ${users}`)
})

socket.on('newMessage', (messagedata) => {
  const newMessage = createMessageElement(messagedata.message, messagedata.date, 'left-message');
  document.querySelector('.container').appendChild(newMessage);
})

socket.on('UserStatus', (ID, bool) => {
  const div = document.getElementById(ID._id);

  if (bool) {
    div.style.backgroundColor = "#04F004"
    div.innerHTML = "Online"
    let circleColor = document.querySelector('#circle-status circle');
    if (circleColor) {
      circleColor.setAttribute("fill", "#04F004");
    } else {
      console.error("Circle element not found");
    }
  } else {
    div.style.backgroundColor = "#B6B6B6"
    div.innerHTML = "Offline"
    let circleColor = document.querySelector('#circle-status circle');
    if (circleColor) {
      circleColor.setAttribute("fill", "#B6B6B6");
    } else {
      console.error("Circle element not found");
    }
  }
});

socket.on("connectedusers", connected => {
  ID = connected.forEach(element => {
    const div = document.getElementById(element._id);
    div.style.backgroundColor = "#04F004";
    div.innerHTML = "Online";
  });
})





const userItems = document.getElementsByClassName('usercard');

var userId = ''

Array.from(userItems).forEach(item => {
  item.addEventListener('click', function () {

    let container = document.getElementsByClassName('container')[0]
    container.innerHTML = ''

    let clicked = document.getElementsByClassName("clicked")[0]
    clicked.style.zIndex = '2';

    userId = this.getAttribute('data-user');
    var user123 = ''
    fetch(`/user/${userId}`)
      .then(response => response.json())
      .then(clickeduser => {
        let username = document.getElementById("top-username")
        let email = document.getElementById("top-email")
        let image = document.getElementById('inner-image')
        image.setAttribute('src', clickeduser.image)
        username.innerHTML = clickeduser.username.charAt(0).toUpperCase() + clickeduser.username.slice(1).toLowerCase()
        email.innerHTML = clickeduser.email
        if (clickeduser.SocketId) {
          let circleColor = document.querySelector('#circle-status circle');
          if (circleColor) {
            circleColor.setAttribute("fill", "#04F004");
          } else {
            console.error("Circle element not found");
          }
        }
        else {
          let circleColor = document.querySelector('#circle-status circle');
          if (circleColor) {
            circleColor.setAttribute("fill", "#B6B6B6");
          } else {
            console.error("Circle element not found");
          }
        }
        user123 = clickeduser.email
      })
      .catch(error => console.error('Error:', error));

    fetch(`/chat-history/${userId}`)
      .then(response => response.json())
      .then(chathistoryArray => {
        console.log("Chat history is" + chathistoryArray)
        console.log(user123)
        chathistoryArray.forEach(chathistory => {
          console.log(chathistory.sender)
          if (chathistory.sender === user123) {
            const newMessage = createMessageElement(chathistory.message, chathistory.date, 'left-message');
            document.querySelector('.container').appendChild(newMessage);
          }
          else {
            const newMessage = createMessageElement(chathistory.message, chathistory.date, 'right-message');
            document.querySelector('.container').appendChild(newMessage);
          }
        })
      })
      .catch(err => {
        console.error(`Error fetching chat-history ${err}`)
      })
    console.log('Clicked user with ID:', userId);
  });
});

let form = document.getElementById('message-form')
form.addEventListener('submit', (event) => {
  event.preventDefault()

  let messageInput = document.getElementById('user-message');
  let message = messageInput.value;

  if (message) {
  
  if (!userId) {
    console.error('User ID is not set');
    return;
  }

  fetch(`/chat/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  })
    .then(response => response.json())
    .then(data => {
      console.log(data)
      const newMessage = createMessageElement(message, data.date, 'right-message');
      document.querySelector('.container').appendChild(newMessage);
      messageInput.value = '';
    })
    .catch(error => {
      console.error('Error:', error);
    });
  }
});

function createMessageElement(messageText, date, classname) {
  const messageDiv = document.createElement('div');
  messageDiv.className = classname + "  message";

  const messageP = document.createElement('p');
  messageP.textContent = messageText;
  messageDiv.appendChild(messageP);

  const bottomDiv = document.createElement('div');
  bottomDiv.className = 'bottom';

  const timeP = document.createElement('p');
  const formate = moment(date).format('MMMM Do YYYY, h:mm:ss a');
  timeP.textContent = formate;
  bottomDiv.appendChild(timeP);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute('width', '24');
  svg.setAttribute('height', '24');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');

  const path1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path1.setAttribute('d', 'M9 11.25L11 13.25L15 9.25');
  path1.setAttribute('stroke', 'currentColor');
  path1.setAttribute('stroke-width', '2');
  path1.setAttribute('stroke-linecap', 'round');
  path1.setAttribute('stroke-linejoin', 'round');

  const path2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path2.setAttribute('d', 'M7 13.25L9 15.25L13 11.25');
  path2.setAttribute('stroke', 'currentColor');
  path2.setAttribute('stroke-width', '2');
  path2.setAttribute('stroke-linecap', 'round');
  path2.setAttribute('stroke-linejoin', 'round');

  svg.appendChild(path1);
  svg.appendChild(path2);

  bottomDiv.appendChild(svg);

  messageDiv.appendChild(bottomDiv);

  const container = document.getElementsByClassName('container')[0];
  setTimeout(() => {
    container.scrollTop = container.scrollHeight;
  }, 0)

  return messageDiv;
}

button = document.getElementById("back")
button.addEventListener("click", function () {
  section2 = document.getElementsByClassName("clicked")[0]
  section2.style.zIndex = '-1'
})

let check = false;
function update() {
  if (check) {
    dropdownList.className = 'dropdown-list';
    check = false;
  } else {
    dropdownList.className = 'dropdown-list show';
    check = true;
  }
}
const dropdownToggle = document.querySelector('.dropdown-toggle');
const dropdownList = document.querySelector('.dropdown-list');

dropdownToggle.addEventListener('click', function (event) {
  event.stopPropagation();
  update()
});

document.addEventListener('click', function (event) {
  if (!event.target.closest('.dropdown')) {
    dropdownList.className = 'dropdown-list';
  }
});


let input = document.getElementById("image");
let uploadForm = document.getElementById("uploadForm");
let uploadPhoto = document.getElementById("1");

uploadPhoto.addEventListener("click", function (event) {
  event.preventDefault();
  input.click();
});

input.addEventListener("change", function () {
  if (input.files.length > 0) {
    console.log("File selected:", input.files[0].name);
    console.log("Attempting to submit form");
    uploadForm.submit();
  }
});

let enabled = false;
let darkmode = document.getElementById('2');

darkmode.addEventListener('click', function (event) {
  event.preventDefault();
  const root = document.documentElement;

  if (enabled) {
    darkmode.innerHTML = 'Dark Mode'
    root.style.setProperty('--bg-color', '#FFFFFF');
    root.style.setProperty('--text-color', '#000000');
    root.style.setProperty('--user-message', '#CCE5FF');
    root.style.setProperty('--received-message', '#D9D9D9');
    root.style.setProperty('--stroke', '#989898');
    enabled = false;
  } else {
    darkmode.innerHTML = 'Light Mode'
    root.style.setProperty('--bg-color', '#1F1F1F');
    root.style.setProperty('--text-color', '#FFFFFF');
    root.style.setProperty('--user-message', '#0056B3');
    root.style.setProperty('--received-message', '#A6A6A6');
    root.style.setProperty('--stroke', '#FFFFFF');
    enabled = true;
  }
});
