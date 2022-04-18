//***- Declarations DOM -*****
const questionEl = document.querySelector(".qestion");
const questionNumber = document.querySelector(".number_qestion");
const label = document.querySelector(".label");
const ansList = document.getElementsByClassName("ansList");
const submit = document.querySelector("#submit");
const showscore = document.querySelector("#showscore");
const questionBar = document.querySelector(".question-bar");
const resultBar = document.querySelector(".result-bar");
const allAnswer = document.querySelector(".allAnswer");
const result = document.querySelector(".result");
const timer = document.querySelector(".timer");

//***- Declarations Variables -*****
var data_lms = "1:A_2:A_3:A_4:A_5:A/390"; /**  1:A_2:A_3:A_4:A_5:A/590 */
var data_quiz = [];
var data_from_json = [];
var lengthQuizJson = 0;
let scorefinal = [];
let countQuest = 0;
let time_start = false;

//***- Declarations Variables Timer -*****
var total_seconds = 0;
var c_minutes = 0;
var c_seconds = 0;


//***- Check Timer -*****
const CheckTime = () => {
  timer.innerText = c_minutes + ":" + c_seconds;
  total_seconds -= 1;
  c_minutes = parseInt(total_seconds / 60);
  c_seconds = parseInt(total_seconds % 60);
};
var CheckTimeID = setInterval(CheckTime, 1000);


//***- Random Array -*****
const shuffleArray = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
};
//***- Load data Json -*****
async function getDataAsync() {
  let data = await await fetch("res/quiz-test.json")
    .then((res) => {
      return res.json();
    })
    .catch((err) => {
      console.log("Error: ", err);
    });
  return data.questions.question;
}
//***- Set data in HTML -*****
const ReadData = () => {
  data_from_json = getDataAsync();
  data_from_json.then((data) => {
    let html = "";
    let data_async = shuffleArray(data);
    // set Time Out start
    if (time_start == false) {
      total_seconds = deserializable(getDataLms(), data_async);
      lengthQuizJson = data_async.length;
      // total_seconds = lengthQuizJson * 60;
      c_minutes = parseInt(total_seconds / 60);
      c_seconds = parseInt(total_seconds % 60);
      time_start = true;
    }
    // set Time Out end
    const Qdb = data_async[countQuest];
    questionNumber.innerText = countQuest + 1 + " / " + lengthQuizJson;
    questionEl.innerText = countQuest + 1 + "- " + Qdb.text;
    questionEl.setAttribute("data-id", Qdb.id);
    var answers = Qdb.answers.answer;

    for (let answer of answers) {
      html +=
        '<li data-id="' +
        Qdb.id +
        '"> <input type="radio" name="option" id="' +
        answer.type +
        '" class="ansList" value="' +
        answer.text +
        '"> <label for="' +
        answer.type +
        '" class="label">' +
        answer.text +
        "</label> </li>";
    }
    allAnswer.innerHTML = html;
  });
};
ReadData();

//***- Submit button -*****
submit.addEventListener("click", function (e) {
  const checkedAnswer = getCheckAnswer();
  let flag = false;
  if (is_checked == true) {
    data_quiz.push(checkedAnswer);
    serializable(data_quiz, false);
    countQuest++;
    deselectAll();
    if (countQuest < lengthQuizJson) {
      ReadData();
    } else {
      clearInterval(CheckTimeID);
      clearInterval(serializableID);
      // serializable(data_quiz);

      for (let ele of data_quiz) {
        if (scorefinal.length != 0) {
          for (let scoreData of scorefinal) {
            if (ele.response == scoreData.response) {
              let last_score = scoreData.score;
              scoreData.score = last_score + 1;
              flag = false;
              break;
            } else {
              flag = true;
            }
          }
          if (flag == true) {
            let result = {
              response: ele.response,
              rubrique: ele.rubrique,
              score: 1,
            };
            scorefinal.push(result);
            flag = false;
          }
        } else {
          // pour la premier fois
          let result = {
            response: ele.response,
            rubrique: ele.rubrique,
            score: 1,
          };
          scorefinal.push(result);
        }
      }
      let html = "";
      for (let scoreData of scorefinal) {
        let score = Math.floor((scoreData.score * 100) / lengthQuizJson);
        html +=
          "<li>A propos la réponse " +
          scoreData.response +
          " - " +
          scoreData.rubrique +
          "  vous avez obtenu " +
          scoreData.score +
          " sur " +
          lengthQuizJson +
          " questions soit " +
          score +
          "% </li>";
      }
      result.innerHTML = html;
      showscore.classList.remove("scoreArea");
      resultBar.classList.remove("hide");
      questionBar.classList.add("hidden");
      document.body.classList.add("score-color--white");
    }
  } else {
    alert("Veuillez sélectionner une réponse ?");
  }
});
//***- Check Answer -*****
const getCheckAnswer = () => {
  let answer = {
    question: questionEl.getAttribute("data-id"),
    response: "",
    rubrique: "",
  };

  var ansList = document.getElementsByClassName("ansList");

  for (i = 0; i < ansList.length; i++) {
    if (ansList[i].checked) {
      answer.response = ansList[i].id;
      answer.rubrique = ansList[i].value;

      if ($("input:radio[name=" + ansList[i].name + "]:checked").length != 0) {
        is_checked = true;
      }
    }
  }
  return answer;
};
//***- Deselect All radio input -*****
const deselectAll = () => {
  for (i = 0; i < ansList.length; i++) {
    ansList[i].checked = false;
  }
  is_checked = false;
};
//***- Deserializable Data for LMS -*****
const deserializable = (data_lms, data_async) => {
  const table_answers = [];
  const index_to_remove = [];
  const data = data_lms.split("/");
  const questions = data[0].split("_");
  for (i = 0; i < questions.length; i++) {
    const answers = questions[i].split(":");
    let answer = {
      question: answers[0],
      response: answers[1],
    };
    table_answers.push(answer);
  }
  for (let i = 0; i < data_async.length; i++) {
    for (let j = 0; j < table_answers.length; j++) {
      if (data_async[i].id == table_answers[j].question) {
        index_to_remove.push(j);
      }
    }
  }
  // Remove from Array 
  for(let i = 0; i < index_to_remove.length; i++){
    data_async.splice(i, 1);
  }
  console.log(data_async);
  let total_seconds = parseInt(data[1]);
  return total_seconds;
};
//***- Serializable Data for LMS -*****
const serializable = (data_quiz, isTimer) => {
  if (isTimer == true) {
    const data = data_lms.split("/");
    data_lms = data[0] + "/" + total_seconds ;
  } else {
    data_lms = "";
    for (let i = 0; i < data_quiz.length; i++) {
      data_lms += data_quiz[i].question + ":" + data_quiz[i].response + "_";
      if (i == data_quiz.length - 1) {
        data_lms += "/" + total_seconds;
      }
    }
  }
  console.log(data_lms);
};
//***- Set Data Quiz for LMS -*****
const setDataLms = (data_lms) => {
  this.data_lms = data_lms;
};
//***- Get Data Quiz for LMS -*****
const getDataLms = () => {
  // return localStorage.getItem("data_lms");
  return this.data_lms;
};
var serializableID = setInterval(function() { serializable(data_quiz, true); }, 1000);
