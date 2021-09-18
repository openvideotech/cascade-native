let step = 0;
let payee = 0;
let originalCapPlaceHolder = null;
const localStorageId = "MOVA-Agreement-JSON";

populateFromLocalStorage();

function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
}

function getOptionIndex(selectElement, value) {
  let options = selectElement.options;
  index = 0;
  for (let option of options) {
    if (option.textContent === value) {
      return index;
    }
    index++;
  }
}

function formatDate(d) {
  let month = '' + (d.getMonth() + 1),
    day = '' + d.getDate(),
    year = d.getFullYear();

  if (month.length < 2) {
    month = '0' + month;
  }
    
  if (day.length < 2) {
    day = '0' + day;
  }

  if (isNaN(year) || isNaN(month) || isNaN(day)) {
    return "";
  } 
    
  return [year, month, day].join('-');
}

function clearAgreement() {
  localStorage.clear();

  const inputs = document.querySelectorAll("input");
  inputs.forEach(el => {
    el.value = "";
  });

  const selects = document.querySelectorAll("select");
  selects.forEach(el => {
    el.selectedIndex = 0;
  });
}

function checkCap(el) {
  let index = el.id.replace("js-step-type", "");
  let cap = document.querySelector(`#js-step-cap${index}`);
  let table = document.querySelector(`#js-payee-table${index}`);

  if (table != null && el.selectedIndex > 0){
    let selectedText = table.querySelector(".js-payeetable-type").textContent = el.options[el.selectedIndex].textContent;
    table.querySelector(".js-payeetable-type").innerText = selectedText;
  }

  if (el.selectedIndex === 2) {
    cap.removeAttribute("disabled");
    if (originalCapPlaceHolder !== null) {
      cap.placeholder = originalCapPlaceHolder;
    }
  } 
  if (el.selectedIndex === 1) {
    cap.setAttribute("disabled", true);
    cap.value = "";
    originalCapPlaceHolder = cap.placeholder;
    cap.placeholder = "n/a";
  }
}

function addStepForm(id) {
  const stepForm = document
    .querySelector("#js-addstep-template")
    .firstElementChild.cloneNode(true);

  if (typeof id !== 'undefined') {
    stepForm.id = `js-step${id}`;
  } else {
    stepForm.id = `js-step${step}`;
  }
  
  // set ids so that we can associate the step with the button clicked

  stepForm.querySelector(".js-trash").id = `js-trash${step}`;
  stepForm.querySelector(".js-add-payee").id = `js-add${step}`;
  stepForm.querySelector(".js-save-step").id = `js-save${step}`;
  stepForm.querySelector(".js-step-type").id = `js-step-type${step}`;
  stepForm.querySelector(".js-step-cap").id = `js-step-cap${step}`;
  //stepForm.querySelector(".js-step-cap-value").id = `js-step-cap-value${step}`;

  let listItem = document.createElement("li");
  listItem.appendChild(stepForm);

  // It seems that slist is designed to be called only once, 
  // if you use it multiple times you need to remove the event listeners first
  // https://stackoverflow.com/questions/19469881/remove-all-event-listeners-of-specific-type

  let allListItems = document.querySelectorAll("#sortlist li");

  
  allListItems.forEach(el => {
    el.removeAttribute("draggable");
    // Note - when cloning you lose the selectedIndex of any select box and so need to re-insert
    let selector = el.querySelector(".js-step-type");
    let selectedIndex = 0;

    if (selector !== null) {
      selectedIndex = el.querySelector(".js-step-type").selectedIndex;
    }
    
    elClone = el.cloneNode(true);

    if (selector !== null) {
      elClone.querySelector(".js-step-type").options[selectedIndex].setAttribute("selected","");
    }
    el.parentNode.replaceChild(elClone, el);
  });


  document.querySelector("#sortlist").appendChild(listItem);
  slist("sortlist");
  step++;
}

function removeStepForm(el) {
  const index = el.id.replace("js-trash", "");
  document.querySelector(`#js-step${index}`).remove();
  step--;

  // rename all steps and buttons so numbers match (no gaps)

  let steps = document.querySelectorAll("#js-form-area .js-addstep-form");

  steps.forEach((el, index) => {
    
    el.id = `js-step${index}`;
    el.querySelector(".js-trash").id = `js-trash${index}`;
    el.querySelector(".js-add-payee").id = `js-add${index}`;
    el.querySelector(".js-save-step").id = `js-save${index}`;

    // TODO: rename step description in form if it exists

  });
}

function addPayee(el) {
  let index = el.id.replace("js-add", "");
  let step = document.querySelector(`#js-step${index}`);

  console.log(step);
  console.log(step.querySelector(".js-step-type"));

  let typeIndex = step.querySelector(".js-step-type").selectedIndex;
  let canAddPayee = false;

  // type is a required field
  if (typeIndex > 0) {

    // create table if it doesn't exist
    let table = step.querySelector("table");

    if (typeof table === "undefined" || table === null) {
      table = document.querySelector("#js-payeetable-template").firstElementChild.cloneNode(true);
      table.id = `js-payee-table${index}`;
      table.querySelector("tbody").id = `js-payee-table-body${index}`;

      // reflect the Step type in the Payee type column

      let select = step.querySelector(".js-step-type");
      table.querySelector(".js-payeetable-type").textContent = select.options[select.selectedIndex].textContent;

      insertAfter(table, el);
      canAddPayee = true;
    } else { // fix previous row

      let rows = step.querySelectorAll(".js-payeerow");
      let lastRow = rows[rows.length - 1];
      let payeeIndex = lastRow.id.replace("js-payee", "");
      let payeeTypeIndex = lastRow.querySelector(".js-payee-type").selectedIndex;
      
      // checking that payee type has been selected OR that the index is undefined
      // if index undefined means that the row is fixed so we can safely add a new one

      if (payeeTypeIndex > 0 || typeof payeeTypeIndex === "undefined") {
        const el = {
          id : payeeIndex + ""
        }
        fixPayee(el);
        canAddPayee = true;
      } else {
        showAlert("Payee Type is a required field.", step);
      }
    }

    if (canAddPayee === true) {
      let row = document.querySelector("#js-payeerow-template");

      // required as a reference for removal / adding
      row.querySelector(".js-payeerow").id = `js-payee${payee}`;
      row.querySelector(".js-remove").id = `js-remove${payee}`;
      row.querySelector(".js-payee-fix").id = `js-payee-fix${payee}`;
  
      payee++;
  
      let tbody = table.querySelector("tbody");
      tbody.innerHTML += row.innerHTML;
    }
    
  } else {
    showAlert("Step Type is a required field.", step);
  }
}

function removePayee(el) {
  let index = el.id.replace("js-remove", "");
  let row = document.querySelector(`#js-payee${index}`);

  // if the last row then delete the table
  let tbody = row.parentElement;

  if (tbody.childElementCount === 1) {
    let index = tbody.id.replace("js-payee-table-body", "");
    let table = document.querySelector(`#js-payee-table${index}`);
    table.remove();
  }

  row.remove();
}

function editPayee(el) {
  let index = el.id.replace("js-edit", "");
  let row = document.querySelector(`#js-payee${index}`);

  let payeeName = row.querySelector(".js-payee-name").textContent;
  let payeeAccount = row.querySelector(".js-payee-ac").textContent;
  let payeeType = row.querySelector(".js-payee-type").textContent;
  let payeeAmount = row.querySelector(".js-payee-amount").textContent;

  let editRow = document.querySelector("#js-payeerow-template").cloneNode(true);

  // required as a reference for removal / adding
  editRow.querySelector(".js-payeerow").id = `js-payee${index}`;
  editRow.querySelector(".js-remove").id = `js-remove${index}`;
  editRow.querySelector(".js-payee-fix").id = `js-payee-fix${index}`;

  editRow.querySelector(".js-payee-name").setAttribute('value', payeeName);
  editRow.querySelector(".js-payee-ac").setAttribute('value', payeeAccount);

  let select = editRow.querySelector(".js-payee-type");
  let selectedIndex = getOptionIndex(select, payeeType);
  select.options[selectedIndex].setAttribute('selected', "true");
  editRow.querySelector(".js-payee-amount").setAttribute('value', payeeAmount);

  row.innerHTML = editRow.innerHTML;
  
}

function fixPayee(el) {
  let index = el.id.replace("js-payee-fix", "");
  let row = document.querySelector(`#js-payee${index}`);

  let typeIndex = row.querySelector(".js-payee-type").selectedIndex;

  // type is a required field
  if (typeIndex > 0) {

    let payeeName = row.querySelector(".js-payee-name").value;
    let payeeAccount = row.querySelector(".js-payee-ac").value;

    let select = row.querySelector(".js-payee-type");
    let payeeType = select.options[select.selectedIndex].textContent;

    let payeeAmount = row.querySelector(".js-payee-amount").value;

    let fixedRow = document.querySelector("#js-payeerow-fixed-template").cloneNode(true);

    // required as a reference for removal / edit
    fixedRow.querySelector(".js-payeerow").id = `js-payee${index}`;
    fixedRow.querySelector(".js-remove").id = `js-remove${index}`;
    fixedRow.querySelector(".js-edit").id = `js-edit${index}`;

    fixedRow.querySelector(".js-payee-name").textContent = payeeName;
    fixedRow.querySelector(".js-payee-ac").textContent = payeeAccount;
    fixedRow.querySelector(".js-payee-type").textContent = payeeType;
    fixedRow.querySelector(".js-payee-amount").textContent = payeeAmount;

    row.innerHTML = fixedRow.innerHTML;
    return true;
  }
  else
  {
    // checking whether typeIndex is undefined, which means row is already fixed
    // so no need to show alert

    if (typeof typeIndex !== "undefined" && typeIndex !== null) {
      showAlert("Payee Type is a required field.", row.parentElement);
      return false;
    } else {
      return true;
    }
  }
}

function saveStep(el) {
  let index = el.id.replace("js-save", "");

  let step = document.querySelector(`#js-step${index}`);
  let typeIndex = step.querySelector(".js-step-type").selectedIndex;
  let typeValue = step.querySelector(".js-step-type").value;

  // type is a required field
  if (typeIndex > 0) {
    
    let cap = step.querySelector(".js-step-cap").value;
    console.log(cap);

    let formattedCap = "";

    if (isNaN(cap)) {
      showAlert("Cap must be a number.", step);
    } else {
      if (cap.length > 0) {
        console.log(document.querySelector("#numberformat").value);

        let formatCurrency = new Intl.NumberFormat(document.querySelector("#numberformat").value, {
          style: 'currency',
          currency: document.querySelector("#currency").value,
        });

        formattedCap = formatCurrency.format(cap);

      }
      
      let description = step.querySelector(".js-step").value;
      let fixedStep = document.querySelector("#js-addstep-fixed-template").cloneNode(true);

      fixedStep.querySelector(".js-edit").id = `js-edit${index}`;
    
      fixedStep.querySelector(".js-step-description").innerText = description;
      fixedStep.querySelector(".js-step-cap").innerText = formattedCap;
      fixedStep.querySelector(".js-step-cap-value").innerText = cap;
      fixedStep.querySelector(".js-step-type-index").innerText = typeIndex;
      fixedStep.querySelector(".js-step-type-value").innerText = typeValue;

      // fix last payee row
      let rows = step.querySelectorAll(".js-payeerow");
      console.log(rows);
      if (rows.length > 0) {
        let lastRow = rows[rows.length - 1];
        let payeeIndex = lastRow.id.replace("js-payee", "");

        const el = {
          id : payeeIndex + ""
        }

        let payeeWasFixed = fixPayee(el);

        if (payeeWasFixed === true) {
          let table = step.querySelector("table");
          step.innerHTML = fixedStep.innerHTML;
          step.querySelector(".js-step-details").append(table);
        } else {
          return false;
        }
      } else {
        step.innerHTML = fixedStep.innerHTML;
        step.querySelector(".js-step-details").append("No payees added.");
      }
    }
    return true;
  } else {
    showAlert("Step Type is a required field.", step);
    return false;
  }
}

function editStep(el) {
  let index = el.id.replace("js-edit", "");
  let row = document.querySelector(`#js-step${index}`);

  let cap = row.querySelector(".js-step-cap-value").textContent;
  let description = row.querySelector(".js-step-description").textContent;
  let stepTypeIndex = row.querySelector(".js-step-type-index").textContent;

  let stepForm = document.querySelector("#js-addstep-template").firstElementChild.cloneNode(true);

  stepForm.id = `js-step${index}`;

  // set ids so that we can associate the step with the button clicked

  stepForm.querySelector(".js-trash").id = `js-trash${index}`;
  stepForm.querySelector(".js-add-payee").id = `js-add${index}`;
  stepForm.querySelector(".js-save-step").id = `js-save${index}`;

  stepForm.querySelector(".js-step-type").id = `js-step-type${index}`;
  stepForm.querySelector(".js-step-cap").id = `js-step-cap${index}`;
  //stepForm.querySelector(".js-step-cap-value").id = `js-step-cap-value${index}`;

  stepForm.querySelector(".js-step").setAttribute('value', description);

  // reformat as number 
  // https://stackoverflow.com/questions/559112/how-to-convert-a-currency-string-to-a-double-with-jquery-or-javascript

  console.log(cap);
  console.log(cap.length);

  if (cap.length > 0) {
    //stepForm.querySelector(".js-step-cap").setAttribute('value', Number(cap.replace(/[^0-9.-]+/g,""))); 
    stepForm.querySelector(".js-step-cap").setAttribute('value', cap); 
  }
  
  let select = stepForm.querySelector(".js-step-type");
  select.options[stepTypeIndex].setAttribute('selected', "true");

  let payees = row.querySelector("table");
  row.innerHTML = stepForm.innerHTML;
  let addPayeeBtn = row.querySelector(".js-add-payee");

  // add the payee table after the "add payee" button
  if (payees !== null) {
    insertAfter(payees, addPayeeBtn);
  }
}

function saveAgreement(el) {

  //TODO do not save agreement until all steps are saved???
  const currencyIndex = document.querySelector("#currency").selectedIndex;
  let saveable = true;
  
  if (currencyIndex > 0) {

    let savedAgreement = new Agreement(
      document.querySelector("#name").value,
      document.querySelector("#currency").value,
      document.querySelector("#pointer").value,
      document.querySelector("#contact").value,
      document.querySelector("#email").value,
      document.querySelector("#description").value
    );

    savedAgreement.addLimit(
      document.querySelector("#period-repeat").value,
      document.querySelector("#period-unit").value,
      formatDate(new Date(document.querySelector("#start").value)), 
      formatDate(new Date(document.querySelector("#end").value))
    );

    const steps = document.querySelectorAll(".js-addstep-form");

    steps.forEach((step, index) => {
      
      // ignore the step template (which doesn't have an id)
      if (step.id.startsWith("js-step") === true) {

        // check that step has been saved, if not try and save it

        let saveStepSuccess = true;
        const inputs = step.querySelectorAll("input");
        
        if (inputs.length > 0) { // Step has open inputs
          const el = {
            id: index + ""
          }
          // attempt to save
          saveStepSuccess = saveStep(el);
        }

        if (saveable === true) {
          saveable = saveStepSuccess;
        }

        if (saveStepSuccess === true) {

          let agreementStep = new Step(
            step.querySelector(".js-step-description").innerText,
            step.querySelector(".js-step-type-value").innerText,
            step.querySelector(".js-step-cap-value").innerText
          )

          const payees = step.querySelectorAll("tbody tr");
          payees.forEach((payee, index) => {

            let agreementPayee = new Payee(
              payee.querySelector(".js-payee-name").innerText,
              payee.querySelector(".js-payee-ac").innerText,
              payee.querySelector(".js-payee-type").innerText,
              payee.querySelector(".js-payee-amount").innerText
            )
            console.log(agreementPayee);
            agreementStep.addPayee(agreementPayee);

          });

          savedAgreement.addStep(agreementStep);
        } 
      }
    });

    // save to localStorage

    if (saveable === true) {
      localStorage.setItem(localStorageId, JSON.stringify(savedAgreement));
      console.log(savedAgreement);
    }
    
  } else {
    showAlert("Currency is a required field.", document.querySelector("#sortlist"));
  }
}

function populateFromLocalStorage(){
  let agreement = JSON.parse(localStorage.getItem(localStorageId));

  if (agreement !== null) {
    //console.log(agreement.name);
    console.log(agreement);
    document.querySelector("#name").value = agreement.name;
    document.querySelector("#pointer").value = agreement.address;
    document.querySelector("#currency").value = agreement.currency;
    document.querySelector("#contact").value = agreement.contactName;
    document.querySelector("#description").value = agreement.description;
    document.querySelector("#period-repeat").value = agreement.repeatFor;
    document.querySelector("#period-unit").value = agreement.unit;
    document.querySelector("#start").value = agreement.startDate;
    document.querySelector("#end").value = agreement.endDate;

    if (agreement.steps.length > 0) {
      agreement.steps.forEach((step, index) => {
        //create step
        addStepForm(index);
        const form = document.querySelector(`#js-step${index}`);
        form.querySelector(".js-step").value = step.description;
        form.querySelector(".js-step-type").value = step.type;

        if (step.type === "fixed") {
          form.querySelector(".js-step-cap").setAttribute("disabled", true);
        } else {
          //form.querySelector(".js-step-cap").setAttribute('value', Number(step.cap.replace(/[^0-9.-]+/g,""))); 
          form.querySelector(".js-step-cap").setAttribute('value', step.cap); 
        }
        
        
        step.payees.forEach((payee, index) => {
          addPayee(form.querySelector(".js-add-payee"));
          const payeeForm = document.querySelectorAll(".js-payeerow")[index];
          payeeForm.querySelector(".js-payee-name").value = payee.name;
          payeeForm.querySelector(".js-payee-ac").value = payee.paymentAddress;

          let select = payeeForm.querySelector(".js-payee-type");
          let selectedIndex = getOptionIndex(select, payee.paymentType);
          select.options[selectedIndex].setAttribute('selected', "true");

          payeeForm.querySelector(".js-payee-amount").value = payee.paymentAmount;
        });

        saveStep(form.querySelector(".js-save-step"));
      });
      
    }
  } 
}
  

function showAlert(message, container) {
  // create div
  const div = document.createElement("div");
  // add classes
  div.className = `alert`;
  // add text
  div.appendChild(document.createTextNode(message));
  // Get parent
  //const container = document.querySelector(".container");
  // get form
  const form = document.querySelector("#agreement-form");
  // insert alert
  //container.insertBefore(div, form);
  container.appendChild(div);
  // timeout after 3 secs
  setTimeout(function () {
    document.querySelector(".alert").remove();
  }, 3000);
}

class Agreement {
  constructor(name, currency, address, contactName, contactEmail, description) {
    this.name = name;
    this.currency = currency;
    this.address = address;
    this.contactName = contactName;
    this.contactEmail = contactEmail;
    this.description = description;

    this.repeatFor = null;
    this.unit = null;
    this.startDate = null;
    this.endDate = null;

    this.steps = new Array();

    this.addLimit = function (repeatFor, unit, startDate, endDate) {
      this.repeatFor = repeatFor;
      this.unit = unit;
      this.startDate = startDate;
      this.endDate = endDate;
    };

    this.addStep = function (step) {
      this.steps.push(step);
    };
  }
}

class Step {
  constructor(description, type, cap) {
    this.description = description;
    this.type = type;
    this.cap = cap;

    this.payees = new Array();

    this.addPayee = function (payee) {
      this.payees.push(payee);
    };
  }
}

class Payee {
  constructor(name, paymentAddress, paymentType, amount) {
    this.name = name;
    this.paymentAddress = paymentAddress;
    this.paymentType = paymentType;
    this.paymentAmount = amount;
  }
}

let myAgreement = new Agreement(
  "Artists United",
  "USD",
  "$ilp.example.com/pN3K3rKULNQh",
  "Artists United",
  null,
  "Founding agreement for film studio coop"
);

myAgreement.addLimit(1, "year", new Date(2021, 8, 19), null);

let step1 = new Step("Bonus for the studio founders", "%", 1000000);

let payee1 = new Payee("Chaplin", "$payee.example.com/charles", "ilp", 25);
step1.addPayee(payee1);

let payee2 = new Payee("Pickford", "$payee.example.com/mary", "ilp", 25);
step1.addPayee(payee2);

let payee3 = new Payee("Griffith", "$payee.example.com/melanie", "ilp", 25);
step1.addPayee(payee3);

let payee4 = new Payee("Fairbanks", "$payee.example.com/douglass", "ilp", 25);
step1.addPayee(payee4);

myAgreement.addStep(step1);

let step2 = new Step(null, "fixed", null);

let payee5 = new Payee("Annual Expenses", "ID001", "dbse", "{{expenses}}");
step2.addPayee(payee5);

myAgreement.addStep(step2);

let step3 = new Step("Profit share between founders and charity", "%", null);

let payee6 = new Payee("Chaplin", "$payee.example.com/charles", "ilp", 12.5);
step3.addPayee(payee6);

let payee7 = new Payee("Pickford", "$payee.example.com/mary", "ilp", 12.5);
step3.addPayee(payee7);

let payee8 = new Payee("Griffith", "$payee.example.com/melanie", "ilp", 12.5);
step3.addPayee(payee8);

let payee9 = new Payee("Fairbanks", "$payee.example.com/douglass", "ilp", 12.5);
step3.addPayee(payee9);

let payee10 = new Payee("UNICEF", "$payee.example.com/unicef", "ilp", 50);
step3.addPayee(payee10);

myAgreement.addStep(step3);

console.log(myAgreement);

/* Drag and drop - from https://code-boxx.com/drag-drop-sortable-list-javascript/ 
Half done. Works for top level but not nested level. Otherwise switch to  https://lukasoppermann.github.io/html5sortable/index.html - which handles nesting - and also table rows. */

function slist(target) {
  // (A) GET LIST + ATTACH CSS CLASS
  target = document.getElementById(target);
  target.classList.add("slist");

  // (B) MAKE ITEMS DRAGGABLE + SORTABLE
  var items = target.getElementsByTagName("li"),
    current = null;
  for (let i of items) {
    // (B1) ATTACH DRAGGABLE
    i.draggable = true;

    // (B2) DRAG START - YELLOW HIGHLIGHT DROPZONES
    i.addEventListener("dragstart", function (ev) {
      current = this;
      for (let it of items) {
        if (it != current) {
          it.classList.add("hint");
        }
      }
    });

    // (B3) DRAG ENTER - RED HIGHLIGHT DROPZONE
    i.addEventListener("dragenter", function (ev) {
      if (this != current) {
        this.classList.add("active");
      }
    });

    // (B4) DRAG LEAVE - REMOVE RED HIGHLIGHT
    i.addEventListener("dragleave", function () {
      this.classList.remove("active");
    });

    // (B5) DRAG END - REMOVE ALL HIGHLIGHTS
    i.addEventListener("dragend", function () {
      for (let it of items) {
        it.classList.remove("hint");
        it.classList.remove("active");
      }
    });

    // (B6) DRAG OVER - PREVENT THE DEFAULT "DROP", SO WE CAN DO OUR OWN
    i.addEventListener("dragover", function (evt) {
      evt.preventDefault();
    });

    // (B7) ON DROP - DO SOMETHING
    i.addEventListener("drop", function (evt) {
      evt.preventDefault();
      if (this != current) {
        let currentpos = 0,
          droppedpos = 0;
        for (let it = 0; it < items.length; it++) {
          if (current == items[it]) {
            currentpos = it;
          }
          if (this == items[it]) {
            droppedpos = it;
          }
        }
        if (currentpos < droppedpos) {
          this.parentNode.insertBefore(current, this.nextSibling);
        } else {
          this.parentNode.insertBefore(current, this);
        }
      }
    });
  }
}
