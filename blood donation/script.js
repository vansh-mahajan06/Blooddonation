// ---------- 1. DATA SETUP ----------
var bloodGroups = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"];

// 8 sample donors loaded by default (only the first time)
var sampleDonors = [
  {id:1, name:"Rahul Sharma", age:28, gender:"Male",   blood:"O+",  phone:"9876543210", email:"rahul@mail.com", city:"Delhi",   last:"2026-06-10", weight:70, health:"Healthy"},
  {id:2, name:"Priya Singh",  age:25, gender:"Female", blood:"A+",  phone:"9876501234", email:"priya@mail.com", city:"Mumbai",  last:"2026-03-15", weight:58, health:"Healthy"},
  {id:3, name:"Amit Verma",   age:35, gender:"Male",   blood:"B+",  phone:"9812345670", email:"amit@mail.com",  city:"Delhi",   last:"2026-10-20", weight:80, health:"Healthy"},
  {id:4, name:"Neha Gupta",   age:30, gender:"Female", blood:"AB+", phone:"9898989898", email:"neha@mail.com",  city:"Pune",    last:"",           weight:62, health:"Healthy"},
  {id:5, name:"Suresh Kumar", age:42, gender:"Male",   blood:"O-",  phone:"9123456780", email:"suresh@mail.com",city:"Chennai", last:"2026-01-05", weight:75, health:"Healthy"},
  {id:6, name:"Anjali Rao",   age:27, gender:"Female", blood:"B-",  phone:"9765432109", email:"anjali@mail.com",city:"Mumbai",  last:"2026-04-22", weight:55, health:"Healthy"},
  {id:7, name:"Vikram Patel", age:33, gender:"Male",   blood:"A-",  phone:"9012345678", email:"vikram@mail.com",city:"Pune",    last:"2026-02-14", weight:68, health:"Has Illness"},
  {id:8, name:"Kavita Joshi", age:38, gender:"Female", blood:"AB-", phone:"9345678901", email:"kavita@mail.com",city:"Delhi",   last:"2026-05-30", weight:64, health:"Healthy"}
];
var sampleInventory = {"A+":18, "A-":6, "B+":12, "B-":3, "O+":25, "O-":8, "AB+":9, "AB-":2};

// Function to load data from localStorage (or use defaults)
function load(key, defaultValue) {
  var saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
}
// Function to save data to localStorage
function save(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

var donors    = load("bd_donors", sampleDonors);
var requests  = load("bd_requests", []);
var inventory = load("bd_inventory", sampleInventory);
save("bd_donors", donors); save("bd_inventory", inventory);

// ---------- 2. HELPER FUNCTIONS ----------
function $(id) { return document.getElementById(id); }

// Function to stop users from injecting HTML into the page
function esc(text) {
  return String(text).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
}

// Function to show a success / error message
function showMsg(id, text, type) {
  var box = $(id);
  box.className = "msg " + type;
  box.textContent = text;
  setTimeout(function(){ box.className = "msg"; }, 4000);
}

// Function to fill a dropdown with all blood groups
function fillBloodDropdown(id) {
  bloodGroups.forEach(function(bg){ $(id).innerHTML += '<option value="' + bg + '">' + bg + '</option>'; });
}

// Function to find stock status from units
function stockStatus(units) {
  if (units < 5)  return {text:"Critical",  cls:"redb"};
  if (units < 10) return {text:"Low",       cls:"orange"};
  return               {text:"Available", cls:"green"};
}

// Function to check if donor can donate (healthy + 90 days since last donation)
function isAvailable(d) {
  if (d.health !== "Healthy") return false;
  if (!d.last) return true;
  var days = (new Date() - new Date(d.last)) / (1000 * 60 * 60 * 24);
  return days >= 90;
}

// ---------- 3. DASHBOARD ----------
// Function to update stat cards and availability table
function renderDashboard() {
  var totalUnits = 0, lives = 0, rows = "";
  bloodGroups.forEach(function(bg){
    totalUnits += inventory[bg];
    var s = stockStatus(inventory[bg]);
    rows += "<tr><td><b>" + bg + "</b></td><td>" + inventory[bg] + '</td><td><span class="badge ' + s.cls + '">' + s.text + "</span></td></tr>";
  });
  requests.forEach(function(r){ if (r.status === "Fulfilled") lives += r.units; });

  $("statDonors").textContent = donors.length;
  $("statUnits").textContent = totalUnits;
  $("statRequests").textContent = requests.length;
  $("statLives").textContent = lives;
  $("availabilityBody").innerHTML = rows;
}

// ---------- 4. DONOR REGISTRATION (Add / Edit / Delete) ----------
// Function to add or update donor when form is submitted
$("donorForm").addEventListener("submit", function(e){
  e.preventDefault();
  var donor = {
    name: $("dName").value.trim(), age: Number($("dAge").value), gender: $("dGender").value,
    blood: $("dBlood").value, phone: $("dPhone").value.trim(), email: $("dEmail").value.trim(),
    city: $("dCity").value.trim(), last: $("dLast").value, weight: Number($("dWeight").value),
    health: $("dHealth").value
  };

  // Validation checks
  if (!donor.name || !donor.gender || !donor.blood || !donor.city || !donor.email)
    return showMsg("donorMsg", "Please fill all required fields.", "err");
  if (donor.age < 18 || donor.age > 65)
    return showMsg("donorMsg", "Age must be between 18 and 65.", "err");
  if (donor.weight < 50)
    return showMsg("donorMsg", "Weight must be at least 50 kg.", "err");
  if (!/^[0-9]{10}$/.test(donor.phone))
    return showMsg("donorMsg", "Phone number must be exactly 10 digits.", "err");

  var editId = $("donorId").value;
  if (editId) {                       // EDIT: replace the old donor with new data
    donor.id = Number(editId);
    donors = donors.map(function(d){ return d.id === donor.id ? donor : d; });
    showMsg("donorMsg", "Donor updated successfully!", "ok");
  } else {                            // ADD: give a new id and push to array
    donor.id = Date.now();
    donors.push(donor);
    showMsg("donorMsg", "Donor registered successfully!", "ok");
  }
  save("bd_donors", donors);
  resetDonorForm(true);
  renderAll();
});

// Function to fill the form with donor data for editing
function editDonor(id) {
  var d = donors.find(function(x){ return x.id === id; });
  $("donorId").value = d.id;     $("dName").value = d.name;   $("dAge").value = d.age;
  $("dGender").value = d.gender; $("dBlood").value = d.blood; $("dPhone").value = d.phone;
  $("dEmail").value = d.email;   $("dCity").value = d.city;   $("dLast").value = d.last;
  $("dWeight").value = d.weight; $("dHealth").value = d.health;
  $("donorSubmit").textContent = "Update Donor";
  $("register").scrollIntoView();
}

// Function to delete a donor
function deleteDonor(id) {
  if (!confirm("Delete this donor?")) return;
  donors = donors.filter(function(d){ return d.id !== id; });
  save("bd_donors", donors);
  renderAll();
}

// Function to clear the donor form
function resetDonorForm(keepMessage) {
  $("donorForm").reset();
  $("donorId").value = "";
  $("donorSubmit").textContent = "Register Donor";
}

// Function to show all donors in the registration table
function renderDonorList() {
  var rows = "";
  donors.forEach(function(d){
    rows += "<tr><td>" + esc(d.name) + "</td><td>" + d.age + "</td><td>" + d.blood + "</td><td>" + esc(d.city) +
      "</td><td>" + esc(d.phone) + '</td><td>' +
      '<button class="btn btn-small" data-donor-action="edit" data-donor-id="' + d.id + '">Edit</button>' +
      '<button class="btn btn-small btn-grey" data-donor-action="delete" data-donor-id="' + d.id + '">Delete</button></td></tr>';
  });
  $("donorListBody").innerHTML = rows || '<tr><td colspan="6">No donors registered yet.</td></tr>';
}
$("donorListBody").addEventListener("click", function(e) {
  var button = e.target.closest("button[data-donor-action]");
  if (!button) return;
  var id = Number(button.getAttribute("data-donor-id"));
  if (button.getAttribute("data-donor-action") === "edit") editDonor(id);
  else deleteDonor(id);
});
$("donorCancel").addEventListener("click", function() { resetDonorForm(); });

// ---------- 5. FIND DONOR (Search + Filters) ----------
// Function to fill the City dropdown from donor data (no duplicates)
function fillCityFilter() {
  var current = $("filterCity").value;
  var cities = [];
  donors.forEach(function(d){
    var c = d.city.trim();
    if (cities.indexOf(c) === -1) cities.push(c);
  });
  cities.sort();
  $("filterCity").innerHTML = '<option value="">All</option>' +
    cities.map(function(c){ return '<option value="' + esc(c) + '">' + esc(c) + "</option>"; }).join("");
  $("filterCity").value = current;
}

// Function to search and filter donors
function renderResults() {
  var text = $("searchBox").value.toLowerCase().trim();
  var bg = $("filterBlood").value;
  var city = $("filterCity").value;

  var found = donors.filter(function(d){
    var matchText = d.name.toLowerCase().indexOf(text) !== -1 || d.city.toLowerCase().indexOf(text) !== -1;
    var matchBlood = bg === "" || d.blood === bg;
    var matchCity = city === "" || d.city === city;
    return matchText && matchBlood && matchCity;
  });

  var rows = "";
  found.forEach(function(d){
    var ok = isAvailable(d);
    rows += "<tr><td>" + esc(d.name) + "</td><td>" + d.blood + "</td><td>" + esc(d.city) + "</td><td>" + esc(d.phone) +
      "</td><td>" + (d.last || "Never") + '</td><td><span class="badge ' + (ok ? "green" : "grey") + '">' +
      (ok ? "Available" : "Not Available") + "</span></td></tr>";
  });
  $("resultsBody").innerHTML = rows || '<tr><td colspan="6">No Donor Found</td></tr>';
}
$("searchBox").addEventListener("input", renderResults);
$("filterBlood").addEventListener("change", renderResults);
$("filterCity").addEventListener("change", renderResults);

// ---------- 6. BLOOD INVENTORY (Add / Remove Units) ----------
// Function to show the inventory table
function renderInventory() {
  var rows = "";
  bloodGroups.forEach(function(bg){
    var s = stockStatus(inventory[bg]);
    rows += "<tr><td><b>" + bg + "</b></td><td>" + inventory[bg] + '</td><td><span class="badge ' + s.cls + '">' + s.text +
      '</span></td><td><input type="number" min="1" value="1" class="inv-input" id="units-' + bg + '"> ' +
      '<button class="btn btn-small" data-stock-group="' + bg + '" data-stock-direction="1">Add</button>' +
      '<button class="btn btn-small btn-grey" data-stock-group="' + bg + '" data-stock-direction="-1">Remove</button></td></tr>';
  });
  $("inventoryBody").innerHTML = rows;
}
$("inventoryBody").addEventListener("click", function(e) {
  var button = e.target.closest("button[data-stock-group]");
  if (!button) return;
  changeUnits(button.getAttribute("data-stock-group"), Number(button.getAttribute("data-stock-direction")));
});

// Function to add (+1) or remove (-1) units of a blood group
function changeUnits(bg, direction) {
  var amount = Number($("units-" + bg).value);
  if (!amount || amount < 1) return alert("Enter a valid number of units.");
  if (direction === -1 && amount > inventory[bg]) return alert("Not enough units to remove.");
  inventory[bg] += amount * direction;
  save("bd_inventory", inventory);
  renderAll();
}

// ---------- 7. BLOOD REQUESTS ----------
// Function to add a request and reduce inventory if stock is available
$("requestForm").addEventListener("submit", function(e){
  e.preventDefault();
  var req = {
    id: Date.now(), patient: $("rPatient").value.trim(), hospital: $("rHospital").value.trim(),
    blood: $("rBlood").value, units: Number($("rUnits").value), urgency: $("rUrgency").value,
    phone: $("rPhone").value.trim(), status: "Pending"
  };

  if (!req.patient || !req.hospital || !req.blood)
    return showMsg("reqMsg", "Please fill all fields.", "err");
  if (!req.units || req.units < 1)
    return showMsg("reqMsg", "Units needed must be at least 1.", "err");
  if (!/^[0-9]{10}$/.test(req.phone))
    return showMsg("reqMsg", "Contact number must be exactly 10 digits.", "err");

  if (inventory[req.blood] >= req.units) {      // enough stock: reduce inventory
    inventory[req.blood] -= req.units;
    req.status = "Fulfilled";
    showMsg("reqMsg", "Request fulfilled! Inventory updated.", "ok");
  } else {                                      // not enough stock: keep as pending
    showMsg("reqMsg", "Not enough stock. Request added as Pending.", "err");
  }
  requests.push(req);
  save("bd_requests", requests); save("bd_inventory", inventory);
  $("requestForm").reset();
  renderAll();
});

// Function to show the request list (newest first)
function renderRequests() {
  var rows = "";
  requests.slice().reverse().forEach(function(r){
    rows += "<tr><td>" + esc(r.patient) + "</td><td>" + esc(r.hospital) + "</td><td>" + r.blood + "</td><td>" + r.units +
      '</td><td><span class="badge ' + (r.urgency === "Urgent" ? "redb" : "grey") + '">' + r.urgency + "</span></td><td>" +
      esc(r.phone) + '</td><td><span class="badge ' + (r.status === "Fulfilled" ? "green" : "orange") + '">' + r.status + "</span></td></tr>";
  });
  $("requestBody").innerHTML = rows || '<tr><td colspan="7">No requests yet.</td></tr>';
}

// ---------- 8. START THE APP ----------
// Function to refresh every part of the page
function renderAll() {
  renderDashboard(); renderDonorList(); fillCityFilter();
  renderResults(); renderInventory(); renderRequests();
}

["dBlood", "filterBlood", "rBlood"].forEach(fillBloodDropdown);
var validPages = ["home", "register", "find", "inventory", "requests", "contact"];

function showPage(page, updateHistory) {
  var currentPage = validPages.indexOf(page) === -1 ? "home" : page;
  document.querySelectorAll("[data-page]").forEach(function(section) {
    section.hidden = section.getAttribute("data-page") !== currentPage;
  });
  document.querySelectorAll("#mainNav a").forEach(function(link) {
    var active = new URL(link.href).searchParams.get("page") === currentPage;
    link.classList.toggle("active", active);
    if (active) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
  if (updateHistory) {
    window.history.pushState({page:currentPage}, "", "?page=" + currentPage);
  }
  $("mainNav").classList.remove("open");
  document.querySelector(".menu-toggle").setAttribute("aria-expanded", "false");
  window.scrollTo(0, 0);
}

document.querySelectorAll('a[href^="?page="]').forEach(function(link) {
  link.addEventListener("click", function(e) {
    e.preventDefault();
    showPage(new URL(link.href).searchParams.get("page"), true);
  });
});
document.querySelector(".menu-toggle").addEventListener("click", function() {
  var isOpen = $("mainNav").classList.toggle("open");
  this.setAttribute("aria-expanded", String(isOpen));
});
window.addEventListener("popstate", function() {
  showPage(new URLSearchParams(window.location.search).get("page"), false);
});

showPage(new URLSearchParams(window.location.search).get("page"), false);
renderAll();
