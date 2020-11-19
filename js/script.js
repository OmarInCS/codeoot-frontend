
let timer;
let myCodeMirror;

// Creator Functions

function toLoginPage(mode) {
    let url = mode === "creator" ? "creator/create-game.html" : "player/join-game.html";
    fetch(url)
        .then((response) => response.text())
        .then((template) => {
            
            var rendered = Mustache.render(template);
            document.getElementById("main-content").innerHTML = rendered;
        })
        .catch((error) => console.log(error));
}

function toStartGamePage() {
    var form = document.getElementById("create-game-form");
    var isValidForm = form.checkValidity();
    if (isValidForm) {
        payload = {
            game_name: document.getElementById("game_name").value,
            duration: document.getElementById("duration").value,
        };

        fetch("https://codeoot-backend.herokuapp.com/games", {
            method: "post",
            body: JSON.stringify(payload),
            headers: {"Content-type": "application/json;charset=UTF-8"}

        }).then((response) => response.json())
        .then((data) => {

            if (!data.success) return console.log("Error");

            let current_game = {
                ...data,
                ...payload
            };
            
            fetch("creator/start-game.html")
            .then((response) => response.text())
            .then((template) => {
                
                var rendered = Mustache.render(template, current_game);
                document.getElementById("main-content").innerHTML = rendered;
                console.log(current_game);
            })
            .catch((error) => console.log(error));

            localStorage.setItem("current_game", JSON.stringify(current_game));

        });
    }
}

function toCountDownPage() {
    let current_game = localStorage.getItem("current_game");
    if (!current_game) return console.log("No Game Created");

    current_game = JSON.parse(current_game);

    fetch(`https://codeoot-backend.herokuapp.com/games/${current_game.game_datetime}`, {
        method: "patch",
        headers: {"Content-type": "application/json;charset=UTF-8"}

    }).then((response) => response.json())
    .then((data) => {

        if (!data.success) return console.log("Response Error");

        current_game.start_time = data.start_time;
        
        fetch("creator/count-down.html")
        .then((response) => response.text())
        .then((template) => {
            let time_obj = {
                minutes: current_game.duration.split(":")[0],
                seconds: current_game.duration.split(":")[1]
            };
            
            let rendered = Mustache.render(template, time_obj);
            document.getElementById("main-content").innerHTML = rendered;
            startCountDownTimer(time_obj);
            console.log(current_game);
        })
        .catch((error) => console.log(error));

        localStorage.setItem("current_game", JSON.stringify(current_game));

    });
}

function startCountDownTimer(time_object) {
    let minutes = parseInt(time_object.minutes);
    let seconds = parseInt(time_object.seconds);
    timer = setInterval(() => {
        if (minutes === 0 && seconds === 0) {
            clearInterval(timer);
            console.log("Time Up");
        }
        else if (seconds === 0) {
            seconds = 59;
            minutes--;
        }
        else {
            seconds--;
        }

        document.getElementById("minutes").innerHTML = String(minutes).padStart(2, "0");
        document.getElementById("seconds").innerHTML = String(seconds).padStart(2, "0");
    }, 1000)
}

function toPodiumPage() {
    clearInterval(timer);
    let current_game = localStorage.getItem("current_game");
    if (!current_game) return console.log("No Game Created");

    current_game = JSON.parse(current_game);

    fetch(`https://codeoot-backend.herokuapp.com/players/${current_game.game_datetime}`, {
        method: "get",
        headers: {"Content-type": "application/json;charset=UTF-8"}

    }).then((response) => response.json())
    .then((data) => {
        
        if (!data.length) return console.log("Response Error");
        
        podiumData = {
            gold_name: data[0]["name"],
            gold_score: data[0]["score"],
            silver_name: data[1]["name"],
            silver_score: data[1]["score"],
            bronze_name: data[2]["name"],
            bronze_score: data[2]["score"],
        }
        console.log(podiumData);
        fetch("creator/podium.html")
        .then((response) => response.text())
        .then((template) => {
            
            let rendered = Mustache.render(template, podiumData);
            document.getElementById("main-content").innerHTML = rendered;
            console.log(podiumData);
            doPodiumAnimation();
        })
        .catch((error) => console.log(error));


    });
}

function doPodiumAnimation() {
    $("#bronze-column").animate({"height": "65%"}, 5000, () => {
        $("#bronze-column").animate({"left": "+=200px"}, "slow", () => {
            $("#silver-column").animate({"height": "75%"}, 5000, () => {
                $("#silver-column").animate({"left": "-=200px"}, "slow", () => {
                    $("#gold-column").animate({"height": "85%"}, 5000);
                });
            });
        });
    });
}

// Player Functions

function handleJoinGame() {
    var form = document.getElementById("join-game-form");
    var isValidForm = form.checkValidity();
    if (!isValidForm) return alert("Fill The Form"); 
    
    payload = {
        game_pin: document.getElementById("game_pin").value,
        player_name: document.getElementById("player_name").value,
    };

    fetch("https://codeoot-backend.herokuapp.com/players", {
            method: "post",
            body: JSON.stringify(payload),
            headers: {"Content-type": "application/json;charset=UTF-8"}

        }).then((response) => response.json())
        .then((data) => {

            if (!data.success) return console.log("Error");

            let current_player = {
                player_id: data["player_id"],
                ...payload
            };
            
            fetch("player/submit-code.html")
            .then((response) => response.text())
            .then((template) => {
                
                var rendered = Mustache.render(template, current_game);
                document.getElementById("main-content").innerHTML = rendered;
                loadCodeEditor();
                console.log(current_player);
            })
            .catch((error) => console.log(error));

            localStorage.setItem("current_player", JSON.stringify(current_player));

        });
}

function handleCodeSubmit() {
    var code = myCodeMirror.getValue();
    if (!code) return alert("Enter your code!!"); 
    var current_player = localStorage.getItem("current_player");
    if (!current_player) return alert("No logged in user!!"); 


    fetch(`http://localhost:5000/players/${current_player.player_id}`, {
            method: "patch",
            body: JSON.stringify({code}),
            headers: {"Content-type": "application/json;charset=UTF-8"}

        }).then((response) => response.json())
        .then((data) => {

            if (data.forgery === true) return alert("CHEATTER 😈!!");
            if (data.forgery === false) return alert("INNOCENT 😇!!");

            if (data.success === true) return alert("Your code submitted");
            
            if (data.success === false) return alert("Submittion Error!!");

            // fetch("join-game.html")
            // .then((response) => response.text())
            // .then((template) => {
                
            //     var rendered = Mustache.render(template, current_game);
            //     document.getElementById("main-content").innerHTML = rendered;
            //     console.log(current_player);
            // })
            // .catch((error) => console.log(error));

            // localStorage.setItem("current_player", JSON.stringify(current_player));

        });
}

function loadCodeEditor() {
    myCodeMirror = CodeMirror.fromTextArea(document.getElementById("ta-code"), {
        mode: document.getElementById("code-mode").value,
        theme: "cobalt"
    });
}