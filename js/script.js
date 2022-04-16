var data_lms = ""; /**  1:A_2:A_3:A_4:A_5:A */
var data_quiz = [];
let xmlContent = "";
let tableBooks = document.getElementById("books");
let lengthQuizXML = 0;
let is_checked = false;
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

let scorefinal = [];

let countQuest = 0;
let score = 0;
loadQuestion();
function loadQuestion() {

  fetch("res/quiz.xml").then((response) => {
    response.text().then((xml) => {
      xmlContent = xml;

      let html = "";
      let parser = new DOMParser();
      let xmlDOM = parser.parseFromString(xmlContent, "application/xml");
      let questions = xmlDOM.querySelectorAll("questions");
      const all_questions = questions[0].children;
      deserializable(getDataLms(),all_questions);

      lengthQuizXML = all_questions.length;
      const Qdb = all_questions[countQuest];
      questionNumber.innerText = countQuest + 1 + " / " + lengthQuizXML;
      questionEl.innerText = countQuest + 1 + "- " + Qdb.children[0].innerHTML;
      questionEl.setAttribute("data-id", Qdb.getAttribute("id"));
      var answers = Qdb.children[1];


      for (let answer of answers.children) {
        html +=
          '<li data-id="'+Qdb.getAttribute("id")+'"> <input type="radio" name="option" id="' +
          answer.getAttribute("type") +
          '" class="ansList" value="'+
          answer.children[0].innerHTML
          +'"> <label for="' +
          answer.getAttribute("type") +
          '" class="label">' +
          answer.children[0].innerHTML +
          "</label> </li>";
      }
      allAnswer.innerHTML = html;
    });
  });
}

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

      if($("input:radio[name="+ansList[i].name+"]:checked").length != 0)
      {
        is_checked = true;
      }
    }
    // console.log(ansList[i].id);
  }
  return answer;
};

const deselectAll = () => {
  for (i = 0; i < ansList.length; i++) {
    ansList[i].checked = false;
  }
  is_checked = false;
};

submit.addEventListener("click", function (e) {
  const checkedAnswer = getCheckAnswer();
  let flag = false;
  if(is_checked == true){
    data_quiz.push(checkedAnswer);
    
    countQuest++;
    deselectAll();
    if (countQuest < lengthQuizXML) {
      loadQuestion();
    } else {

      serializable(data_quiz);

      console.log(data_quiz);
  
      for (let ele of data_quiz) {
        if(scorefinal.length !=0){
          for(let scoreData of scorefinal){
            if(ele.response == scoreData.response){
              let last_score = scoreData.score;
              scoreData.score = last_score + 1
              flag = false;
              break;
            }else{
              flag = true;
            }
          }
          if(flag == true){
            let result = {
              response: ele.response,
              rubrique: ele.rubrique,
              score: 1
            }; 
            scorefinal.push(result);
            flag = false;
          }

        }else{
          // pour la premier fois
          let result = {
            response: ele.response,
            rubrique: ele.rubrique,
            score: 1
          }; 
          scorefinal.push(result);

        }
      }
      let html = '';
      for(let scoreData of scorefinal){
        let score = Math.floor((scoreData.score * 100) / lengthQuizXML) ;
        html += '<li>A propos la réponse '+scoreData.response+' - '+scoreData.rubrique+'  vous avez obtenu '+scoreData.score+' sur '+lengthQuizXML+' questions soit '+score+'% </li>';
      }
      result.innerHTML = html;
      showscore.classList.remove("scoreArea");
      resultBar.classList.remove("hide");
      questionBar.classList.add("hidden");
      document.body.classList.add("score-color--white");
    }
  }else{
    alert("Veuillez sélectionner une réponse ?")
  }
  
});



const deserializable  = (data_lms,all_questions) => {
  const table_answers = [];
  const questions = data_lms.split('_');
  for (i = 0; i < questions.length; i++){
    const answers = questions[i].split(':');
    let answer = {
      question: answers[0],
      response: answers[1],
    };
    table_answers.push(answer);
  }
  for (let i = 0; i < all_questions.length; i++) {
    for (let j = 0; j < table_answers.length; j++) {
      if(all_questions[i].getAttribute("id") == table_answers[j].question){
        all_questions[i].remove();
      }

    }
  }
};

const serializable  = (data_quiz) => {
  var data_lms = "";
  for (let i = 0; i < data_quiz.length; i++) {
    data_lms += data_quiz[i].question + ":" + data_quiz[i].response + "_";

  }
  console.log(data_lms);
};

const setDataLms  = (data_lms) => {
  this.data_lms = data_lms;
};

const getDataLms  = () => {
  return data_lms;
};