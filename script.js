player = localStorage.getItem('player');
try {
    highscore = JSON.parse(localStorage.getItem('highscore'));
} catch (error) {
}

if (!highscore) {
    highscore={}
}

const app = document.querySelector('#app')
const fireworks = new Fireworks.default(app, {
    autoresize: false,
    boundaries: {
        width: app.clientWidth,
        height: app.clientHeight
    }});


function updateHighscore() {

    for (g of ["add", "sub", "mul", "div"]) {
        table = document.querySelector("#highscore-"+g+" .entries");
        table.innerHTML = "";

        if (highscore[g]) {
            highscore[g].forEach((entry, index) => {
                table.innerHTML += "<tr><td>" + (index+1) + ".</td><td>"+entry.playerName+"</td><td>"+entry.time+"</td></tr>"
            });
        }
    }
}

updateHighscore();

document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', event => {
        event.preventDefault();
        navigate(event.target.getAttribute('data-route'));
    });
});

function navigate(route) {
    document.querySelectorAll('nav a').forEach(link => {
        if (link.getAttribute('data-route') == route) {
          link.classList.add("selected");
        } else {
          link.classList.remove("selected");
        }
    })

    document.querySelectorAll('.view').forEach(view => {
        view.classList.add('hidden');
    });
    document.getElementById(route).classList.remove('hidden');
    history.pushState(null, '', `#${route}`);

    if (route != "result") {
        fireworks.stop();
    }
}

window.addEventListener('popstate', () => {
    const route = location.hash.replace('#', '');
    navigate(route);
});

const form = document.getElementById("nameForm");

form.addEventListener("submit", function(event) {
    event.preventDefault(); // Prevent the form from submitting the traditional way
    const playerName = document.getElementById("player").value;
    if (playerName) {
        login(playerName);
        navigate("select");
    }
});

function quickLogin(playerName) {
    login(playerName);
    navigate("select");
}

function login(username) {
    player = username;
    document.querySelectorAll(".playername").forEach(el => el.innerHTML = player);
    localStorage.setItem("player", player);
    document.querySelectorAll('.authenticated').forEach(el => el.classList.remove('hidden'));
    document.querySelectorAll('.unauthenticated').forEach(el => el.classList.add('hidden'));
}

function logout() {
    player = null;
    localStorage.removeItem("player");
    document.querySelectorAll(".playername").forEach(el => el.innerHTML = "");
    document.querySelectorAll('.authenticated').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.unauthenticated').forEach(el => el.classList.remove('hidden'));
    navigate("login")
}

function ascending(a, b) { return a-b; }

function shuffle(array) {
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function question(q, a) {
    return {question: q, answer: a}
}

function addQuestions() {
    let questions = []
    for (a = 1; a <= 20; a++) {
        for (b = 0; b <= 20; b++) {
            questions.push(question(a + " + " + b + " =", a+b));
        }
    }
    return questions;
}

function subQuestions() {
    let questions = []
    for (a = 0; a <= 20; a++) {
        for (b = a; b <= 20; b++) {
            questions.push(question(b + " - " + a + " =", b-a));
        }
    }
    return questions;
}

function mulQuestions() {
    let questions = []
    for (a = 2; a <= 10; a++) {
        for (b = 2; b <= 10; b++) {
            questions.push(question(a + " * " + b + " =", a*b));
        }
    }
    return questions;
}

function divQuestions() {
    let questions = []
    for (a = 2; a <= 10; a++) {
        for (b = 2; b <= 10; b++) {
            questions.push(question((a*b) + " / " + b + " =", a));
        }
    }
    return questions;
}

function addHighscore(time) {
    if (!highscore[game]) {
        highscore[game] = []
    }
    h = highscore[game]
    h.push({playerName: player, time: time})
    h.sort((a, b) => a.time - b.time);
    localStorage.setItem('highscore',  JSON.stringify(highscore));
    updateHighscore();
}

function finishTest() {
    const endTime = new Date();
    const elapsedTime = endTime - startTime;

    const result = document.querySelector('span.result');
    result.innerHTML = correctQuestions + " von " + totalQuestions;

    const time = document.querySelector('div.time');
    time.innerHTML = (elapsedTime / 1000.0) + " Sekunden"        

    addHighscore(elapsedTime / 1000.0);
    navigate("result");

    fireworks.start()
}

function nextTest() {
    if (questionNr == totalQuestions) {
        finishTest();
        return;
    }
    questionNr += 1;
    const counter = document.querySelector('div.counter');
    counter.innerHTML = "Frage " + questionNr;


    const test = tests[(questionNr-1)%tests.length]

    const q = document.querySelector('div.question');
    q.innerHTML = test.question;

    const answers = document.querySelector('div.answers');
    answersHtml = "";
    choices = new Set();
    
    // Add correct answer
    choices.add(test.answer);
    correctAnswer = test.answer;

    while (choices.size < 3) {
        j = Math.floor(Math.random() * uniq_answers.length)
        a = uniq_answers[j]
        if (!choices.has(a)) {
            choices.add(a);
        }
    }

    choices = Array.from(choices).sort(ascending)

    for (i = 0; i < choices.length; i++) {
        answersHtml += "<button class=\"answer\" onclick=\"validateAnswer(event);\">" + choices[i] +"</button>";
    }
    answers.innerHTML = answersHtml;
}

function validateAnswer(event) {
    const userAnswer = parseInt(event.target.textContent);

    const buttons = document.querySelectorAll('button.answer');
    // disable all buttons
    buttons.forEach(b => b.disabled = true);

    if (userAnswer == correctAnswer) {
        correctQuestions += 1;
        event.target.classList.add("correct");
        setTimeout(nextTest, 100);
    } else {
        event.target.classList.add("wrong");
        setTimeout(nextTest, 2000);
    }

}

function startGame(g) {
    game = g;
    switch (game) {
        case 'mul': tests = mulQuestions(); break;
        case 'div': tests = divQuestions(); break;
        case 'add': tests = addQuestions(); break;
        case 'sub': tests = subQuestions(); break;
    }

    uniq_answers = Array.from(new Set(tests.map(t => t.answer))).sort(ascending);
    shuffle(tests);
    
    questionNr = 0
    correctQuestions = 0;
    totalQuestions = 10;
    
    startTime = new Date();
    nextTest();
    navigate("game");
}

// Initial navigation
var nav = 'highscore';
if (location.hash) {
    nav = location.hash.replace('#', '');
}
if (player) {
    login(player);
}
if (!player && nav != "highscore") nav = 'login';
if (nav == "game") {
    nav = "select";
}
navigate(nav);