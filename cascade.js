/*-------------------------------------------------------+
| Cascade,  a revenue-sharing agreement builder          |
| Copyright (C) 2021 Netribution Ltd                     |
| Author: Mark Boas                                      |
|         Nicol Wistreich                                |
+--------------------------------------------------------+
| This program is released as free software under the    |
| Affero GPL license. You can redistribute it and/or     |
| modify it under the terms of this license which you    |
| can read by viewing the included license.txt or online |
| at www.gnu.org/licenses/agpl.html. Removal of this     |
| copyright header is strictly prohibited without        |
| written permission from the original author(s).        |
+--------------------------------------------------------*/

class Cascade {

  constructor(localStorageId) {
    console.log("in cascade constructor");
    this.step = 0;
    this.payee = 0;
    this.saveable = true;
    this.originalCapPlaceHolder = null;
    this.localStorageId = localStorageId;
    this.savedAgreement = null;
    //this.populateFromLocalStorage();
  }

  init = () => {
    console.log("cascade init");
    this.populateFromLocalStorage();

  }

  insertAfter = (newNode, referenceNode) => {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  }

  // A function we use when we have the actual text (not value)
  // of a select box, and we want to grab the index to set it

  getOptionIndex = (selectElement, value) => {
    let options = selectElement.options;
    let index = 0;

    //TODO - check that options are not null or undefined

    for (let option of options) {
      if (option.textContent === value) {
        return index;
      }
      index++;
    }
  }

  // Format dates as yyyy-mm-dd

  formatDate = (d) => {
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

  clearAgreement = () => {
    localStorage.clear();

    // Sometimes we have to force input and select elements
    // to be blank to reset them.

    const inputs = document.querySelectorAll("input");
    inputs.forEach(el => {
      el.value = "";
    });

    const textareas = document.querySelectorAll("textarea");
    textareas.forEach(el => {
      el.value = "";
    });

    const selects = document.querySelectorAll("select");
    selects.forEach(el => {
      el.selectedIndex = 0;
    });

    document.querySelector("#sortlist").innerHTML = "";
    document.querySelector("#js-rsml").innerHTML = "";
    document.querySelector("#agreement").style.display = "none";
  }

  checkCap = (el) => {
    let index = el.id.replace("js-step-type", "");
    let cap = document.querySelector(`#js-step-cap${index}`);
    let table = document.querySelector(`#js-payee-table${index}`);

    // set the type field with the selected type text (not value)
    if (table != null && el.selectedIndex > 0){
      let selectedText = table.querySelector(".js-payeetable-type").textContent = el.options[el.selectedIndex].textContent;
      table.querySelector(".js-payeetable-type").innerText = selectedText;
    };

    // check to see if we need to disable cap depending on options
    // note - we use the index here so assumes order won't change

    if (el.selectedIndex === 2) { // %
      cap.removeAttribute("disabled");
      if (this.originalCapPlaceHolder !== null) {
        cap.placeholder = originalCapPlaceHolder;
      }
    }
    if (el.selectedIndex === 1) { // Fixed
      cap.setAttribute("disabled", true);
      cap.value = "";
      this.originalCapPlaceHolder = cap.placeholder;
      cap.placeholder = "n/a";
    }
  };

  addStepForm = (id) => {
    const stepForm = document
      .querySelector("#js-addstep-template")
      .firstElementChild.cloneNode(true);

    if (typeof id !== 'undefined') {
      stepForm.id = `js-step${id}`;
    } else {
      stepForm.id = `js-step${this.step}`;
    }

    // set ids so that we can associate the step with the button clicked

    stepForm.querySelector(".js-trash").id = `js-trash${this.step}`;
    stepForm.querySelector(".js-add-payee").id = `js-add${this.step}`;
    stepForm.querySelector(".js-save-step").id = `js-save${this.step}`;
    stepForm.querySelector(".js-step-type").id = `js-step-type${this.step}`;
    stepForm.querySelector(".js-step-cap").id = `js-step-cap${this.step}`;

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

      let elClone = el.cloneNode(true);

      if (selector !== null) {
        elClone.querySelector(".js-step-type").options[selectedIndex].setAttribute("selected","");
      }
      el.parentNode.replaceChild(elClone, el);
    });

    document.querySelector("#sortlist").appendChild(listItem);
    slist("sortlist");
    this.step++;
  };

  removeStepForm = (el) => {
    const index = el.id.replace("js-trash", "");
    document.querySelector(`#js-step${index}`).remove();
    this.step--;

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

  addPayee = (el) => {
    let index = el.id.replace("js-add", "");
    let step = document.querySelector(`#js-step${index}`);

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

        this.insertAfter(table, el);
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
          this.fixPayee(el);
          canAddPayee = true;
        } else {
          this.showAlert("Payee Type is a required field.", step);
        }
      }

      if (canAddPayee === true) {
        let row = document.querySelector("#js-payeerow-template");

        // required as a reference for removal / adding
        row.querySelector(".js-payeerow").id = `js-payee${this.payee}`;
        row.querySelector(".js-remove").id = `js-remove${this.payee}`;
        row.querySelector(".js-payee-fix").id = `js-payee-fix${this.payee}`;

        this.payee++;

        let tbody = table.querySelector("tbody");
        tbody.innerHTML += row.innerHTML;
      }

    } else {
      this.showAlert("Step Type is a required field.", step);
    }
  }

  removePayee = (el) => {
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

  editPayee = (el) => {
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
    let selectedIndex = this.getOptionIndex(select, payeeType);
    select.options[selectedIndex].setAttribute('selected', "true");
    editRow.querySelector(".js-payee-amount").setAttribute('value', payeeAmount);

    row.innerHTML = editRow.innerHTML;
  }

  fixPayee = (el) => {
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
        this.showAlert("Payee Type is a required field.", row.parentElement);
        return false;
      } else {
        return true;
      }
    }
  }

  saveStep = (el) => {
    let index = el.id.replace("js-save", "");
    let step = document.querySelector(`#js-step${index}`);
    let typeIndex = step.querySelector(".js-step-type").selectedIndex;
    let typeValue = step.querySelector(".js-step-type").value;

    // type is a required field
    if (typeIndex > 0) {

      let cap = step.querySelector(".js-step-cap").value;
      let formattedCap = "";

      if (isNaN(cap)) {
        this.showAlert("Cap must be a number.", step);
      } else {
        if (cap.length > 0) {
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

        if (rows.length > 0) {
          let lastRow = rows[rows.length - 1];
          let payeeIndex = lastRow.id.replace("js-payee", "");

          const el = {
            id : payeeIndex + ""
          }

          let payeeWasFixed = this.fixPayee(el);

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
      this.showAlert("Step Type is a required field.", step);
      return false;
    }
  }

  editStep = (el) => {
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
    stepForm.querySelector(".js-step").setAttribute('value', description);

    if (cap.length > 0) {
      stepForm.querySelector(".js-step-cap").setAttribute('value', cap);
    }

    let select = stepForm.querySelector(".js-step-type");
    select.options[stepTypeIndex].setAttribute('selected', "true");

    let payees = row.querySelector("table");
    row.innerHTML = stepForm.innerHTML;
    let addPayeeBtn = row.querySelector(".js-add-payee");

    // add the payee table after the "add payee" button
    if (payees !== null) {
      this.insertAfter(payees, addPayeeBtn);
    }
  }

  saveAgreement = (final) => {

    const currencyIndex = document.querySelector("#currency").selectedIndex;
    this.saveable = true;

    if (currencyIndex > 0) {

      this.savedAgreement = new Agreement(
        document.querySelector("#name").value,
        document.querySelector("#currency").value,
        document.querySelector("#pointer").value,
        document.querySelector("#contact").value,
        document.querySelector("#email").value,
        document.querySelector("#description").value
      );

      this.savedAgreement.addLimit(
        document.querySelector("#period-repeat").value,
        document.querySelector("#period-unit").value,
        this.formatDate(new Date(document.querySelector("#start").value)),
        this.formatDate(new Date(document.querySelector("#end").value))
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
            saveStepSuccess = this.saveStep(el);
          }

          if (this.saveable === true) {
            this.saveable = saveStepSuccess;
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
              agreementStep.addPayee(agreementPayee);
            });

            this.savedAgreement.addStep(agreementStep);
          }
        }
      });

      // save to localStorage

      if (this.saveable === true) {
        //localStorage.setItem(this.localStorageId, JSON.stringify(savedAgreement));
        this.performSave(final);
      }
    } else {
      this.showAlert("Currency is a required field.", document.querySelector("#sortlist"));
    }
  }

  // final parameter not used here, but required for some extensions of this class with overidden method
  performSave(final) {
    localStorage.setItem(this.localStorageId, JSON.stringify(this.savedAgreement));
  }

  populateFromLocalStorage = (savedAgreement) => {

    console.log("in cascade populateFromLocalstorage");
    console.log(savedAgreement);

    // The way we recreate the agreement from localStorage is to actually
    // recreate all the forms, populate them and save them.
    // The idea is to reuse existing functions.
    
    let agreement = null;

    if (savedAgreement !== null) {

      agreement = savedAgreement;      
    
    } else {

      agreement = JSON.parse(localStorage.getItem(this.localStorageId));

    }

    if (agreement !== null) {
      document.querySelector("#name").value = agreement.name;
      document.querySelector("#pointer").value = agreement.address;
      document.querySelector("#currency").value = agreement.currency;
      document.querySelector("#contact").value = agreement.contactName;
      document.querySelector("#description").value = agreement.description;
      document.querySelector("#period-repeat").value = agreement.repeatFor;
      document.querySelector("#period-unit").value = agreement.unit;
      document.querySelector("#start").value = agreement.startDate;
      document.querySelector("#end").value = agreement.endDate;

      let payeeIndex = 0;

      if (agreement.steps.length > 0) {
        agreement.steps.forEach((step, index) => {
          //create step
          this.addStepForm(index);

          const form = document.querySelector(`#js-step${index}`);
          form.querySelector(".js-step").value = step.description;
          form.querySelector(".js-step-type").value = step.type;

          if (step.type === "fixed") {
            form.querySelector(".js-step-cap").setAttribute("disabled", true);
          } else {
            form.querySelector(".js-step-cap").value = step.cap;
          }

          step.payees.forEach(payee => {
            this.addPayee(form.querySelector(".js-add-payee"));
            const payeeForm = document.querySelectorAll(".js-payeerow")[payeeIndex];

            payeeIndex++;

            payeeForm.querySelector(".js-payee-name").value = payee.name;
            payeeForm.querySelector(".js-payee-ac").value = payee.paymentAddress;

            let select = payeeForm.querySelector(".js-payee-type");
            let selectedIndex = this.getOptionIndex(select, payee.paymentType);
            select.options[selectedIndex].setAttribute('selected', "true");

            payeeForm.querySelector(".js-payee-amount").value = payee.paymentAmount;
          });

          this.saveStep(form.querySelector(".js-save-step"));
        });
      }
    }
  }

  sanitise = (str) => {
    const specialChars = [':','{','}','[',']','&','*','#','?','|','-','<','>','=','!','%','@','\\'];

    let quoteWrap = false;

    specialChars.forEach(char => {
      if(str.indexOf(char) > -1) {
        quoteWrap = true;
      }
    });

    const booleanStrings = ['yes','no','true','false'];

    booleanStrings.forEach(string => {
      if(str.toLowerCase() === string) {
        quoteWrap = true;
      }
    });

    str = str.replaceAll("'","''");
    str = str.replaceAll('"','\\"');

    if (quoteWrap === true) {
      return `'${str}'`;
    } else {
      return str;
    }
  }

  generateAgreement = () => {

    // save agreement first, just in case
    this.saveAgreement();

    const agreement = JSON.parse(localStorage.getItem(this.localStorageId));

    if (agreement !== null) {
      let rsml = document.querySelector("#js-rsml");
      rsml.innerHTML = "";

      rsml.append(`name: ${this.sanitise(agreement.name)}\n`);

      if (agreement.description.length > 0) {
        rsml.append(`description: ${this.sanitise(agreement.description)}\n`);
      }

      if (agreement.address.length > 0) {
        rsml.append(`pointer: ${this.sanitise(agreement.address)}\n`);
      }

      if (agreement.currency.length > 0) {
        rsml.append(`currency: ${this.sanitise(agreement.currency)}\n`);
      }

      if (agreement.contactName.length > 0) {
        rsml.append(`contact: ${this.sanitise(agreement.contactName)}\n`);
      }

      if (agreement.contactEmail.length > 0) {
        rsml.append(`email: ${this.sanitise(agreement.contactEmail)}\n`);
      }

      if (agreement.startDate.length > 0) {
        rsml.append(`starts: ${this.sanitise(agreement.startDate)}\n`);
      }

      if (agreement.endDate.length > 0) {
        rsml.append(`ends: ${this.sanitise(agreement.endDate)}\n`);
      }

      if (agreement.repeatFor.length > 0 && agreement.unit.length > 0) {
        rsml.append(`period: ${this.sanitise(agreement.repeatFor)} ${this.sanitise(agreement.unit)}\n`);
      }

      if (agreement.steps.length > 0) {
        rsml.append(`steps:\n`);
        agreement.steps.forEach(step => {

          rsml.append(`-\n  type: ${this.sanitise(step.type)}\n`);

          if (step.description.length > 0) {
            rsml.append(`  description: ${this.sanitise(step.description)}\n`);
          }

          if (step.cap.length > 0) {
            rsml.append(`  cap: ${this.sanitise(step.cap)}\n`);
          }

          if (step.payees.length > 0) {
            rsml.append(`  payees:\n`);
            step.payees.forEach(payee => {

              rsml.append(`    - [ ${this.sanitise(payee.name)}, ${this.sanitise(payee.paymentType)}, ${this.sanitise(payee.paymentAddress)}, ${this.sanitise(payee.paymentAmount)} ]\n`);
            });
          }
        });
      }
      document.querySelector("#agreement").style.display = "block";
    }
  }

  showAlert = (message, container) => {
    const div = document.createElement("div");
    div.className = `alert`;
    div.appendChild(document.createTextNode(message));
    const form = document.querySelector("#agreement-form");
    container.appendChild(div);
    // timeout after 3 secs
    setTimeout(function () {
      document.querySelector(".alert").remove();
    }, 3000);
  }
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

/* Drag and drop - from https://code-boxx.com/drag-drop-sortable-list-javascript/ */

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

