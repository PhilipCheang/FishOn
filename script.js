'use strict';
// fish = duration. size = distance. bait = cadence
class Fishing {
  // create a new date in popup window
  date = new Date();
  // it better to use libraries to create id
  id = (Date.now() + '').slice(-10);
  clicks = 0;

  constructor(coords, size, fish, bait) {
    this.coords = coords; // [lat, lng]
    this.size = size; // in miles
    this.fish = fish; // in minutes
    this.bait = bait;
  }

  // Create a method for date. you can use the comment pretty to ignore so months are arrange horizontally vs vertically
  _setDescription() {
    // prettier-ignore
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    // convert time to start with a 0 if single digit
    const hours = String(this.date.getHours()).padStart(2, '0');
    const minutes = String(this.date.getMinutes()).padStart(2, '0');

    this.description = `${this.type[0].toUpperCase()}${this.type.slice(1)} on ${
      months[this.date.getMonth()] // get month get current month
    } ${this.date.getDate()} at ${hours}:${minutes}`;
  }
  // add a click count when click on trip list
  click() {
    this.clicks++;
  }
}

class Freshwater extends Fishing {
  type = 'freshwater';
  constructor(coords, size, fish, bait) {
    super(coords, size, fish, bait);
    this._setDescription(); // need to add to child since we need type
  }
}

class Saltwater extends Fishing {
  type = 'saltwater';
  constructor(coords, size, fish, bait) {
    super(coords, size, fish, bait);
    this._setDescription(); // need to add to child since we need type
  }
}
// creating a run activity an inputing data based off parameters. Experient testing
// const run1 = new Freshwater([39, -12], 5.2, 24, 178);
// const cycl1 = new Saltwater([39, -12], 27, 95, 523);
// console.log(run1, cycl1);
/////////////////////////////////////
// Application Architecture
const form = document.querySelector('.form');
const containerFishing = document.querySelector('.fishing');
const inputWater = document.querySelector('.form__input--water');
const inputSize = document.querySelector('.form__input--size');
const inputFish = document.querySelector('.form__input--fish');
const inputBait = document.querySelector('.form__input--bait');

class App {
  // private instance properties
  #map;
  #mapZoomLevel = 14;
  #mapEvent;
  // create an empty array to push each trip
  #trips = [];
  // Load Page. You can add event listener here if element doesn't exist yet
  constructor() {
    // Get users position
    this._getPosition();

    // Get data from local storage
    this._getLocalStorage();
    // Attach event handlers
    // we need to point to form so we add a bind to this without it would point to app
    form.addEventListener('submit', this.newTrip.bind(this));

    // place in constructor because element not exist yet
    containerFishing.addEventListener('click', this._moveToPopup.bind(this));
  }

  _getPosition() {
    if (navigator.geolocation)
      // this is undefined so you need to bind it to this
      navigator.geolocation.getCurrentPosition(
        this._loadMap.bind(this),
        function () {
          alert(
            'Turn on location services for your browser in privacy security settings'
          );
        }
      );
  }

  // Received position
  _loadMap(position) {
    // deconstructure
    const { latitude } = position.coords;
    const { longitude } = position.coords;
    console.log(`https://www.google.pt/maps/@${latitude},${longitude}`);
    // we store latitude and longitude in a variable called coords
    const coords = [latitude, longitude];

    // use the coords variable to show our location
    this.#map = L.map('map').setView(coords, this.#mapZoomLevel);
    // console.log(map);

    L.tileLayer('https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    // on is inherited method inside of leaflet. we want to use it as an event listener
    // handling clicks on map
    // error fix cannot write private member #mapEvent to an object whose class did not declare it
    this.#map.on('click', this._showForm.bind(this)); //.bind(this) fix error

    // load markers saved on local storage
    this.#trips.forEach(trip => {
      this._renderTripMarker(trip);
    });
  }

  // // Click on map
  _showForm(mapE) {
    this.#mapEvent = mapE;
    // remove hidden class
    form.classList.remove('hidden');
    // when click it will go to the input size
    inputSize.focus();
  }
  // hide form after submit form
  _hideForm() {
    // Empty inputs
    // prettier-ignore
    inputSize.value = inputFish.value = '';

    form.style.display = 'none';
    form.classList.add('hidden');
    setTimeout(() => (form.style.display = 'grid'), 1000);
  }

  // Submit form
  newTrip(e) {
    e.preventDefault();
    // Get data from form
    // you can still grab the value even if a select option
    const type = inputWater.value;
    // need to convert to a number
    const size = +inputSize.value;
    const fish = inputFish.value;
    const bait = inputBait.value;
    //deconstructor mapEvent.latlng object to store them in lat lng variable we are able to reuse it
    const { lat, lng } = this.#mapEvent.latlng;

    // when we use ... rest parameters we get an array
    const validInputs = (...inputs) =>
      inputs.every(inp => Number.isFinite(inp)); // will loop over inputs array and check every if number is finite
    // check if inputs are positive
    const allPositive = (...inputs) => inputs.every(inp => inp > 0); // checking every inputs which are size, fish, bait is greater than zero

    let trip;

    // if trip is freshwater, create freshwater object
    if (type === 'freshwater') {
      // check if data is valid
      if (
        // !Number.isFinite(size) ||
        // !Number.isFinite(fish) ||
        // !Number.isFinite(bait)
        !validInputs(size) ||
        !allPositive(size)
      )
        return alert('Inputs have to be postive numbers!');
      // create a new trip
      trip = new Freshwater([lat, lng], size, fish, bait);
      // push trip to trips array
    }
    // if trip is saltwater, create saltwater object
    if (type === 'saltwater') {
      if (!validInputs(size) || !allPositive(size))
        return alert('Inputs have to be postive numbers!');
      // we use let trip so we can use trip in freshwater and saltwater
      trip = new Saltwater([lat, lng], size, fish, bait);
    }
    // Add new object to trip array
    this.#trips.push(trip);

    // Render trip on map as marker
    this._renderTripMarker(trip);

    // console.log(this.#mapEvent);

    // add markers when click on map

    // Render trip on list
    this._renderTrip(trip);

    // Hide form + Clear input fields
    this._hideForm();

    // Set local storage to all trips
    this._setLocalStoarage();
  }
  _renderTripMarker(trip) {
    // communicate with leaflet to display this marker
    L.marker(trip.coords)
      .addTo(this.#map)
      .bindPopup(
        L.popup({
          // read leaflet docs in order to change default settings
          maxWidth: 250,
          minWidth: 100,
          autoClose: false,
          closeOnClick: false,
          className: `${trip.type}-popup`,
        })
      )
      .setPopupContent(
        `${trip.type === 'freshwater' ? '💦' : '🧂'} ${trip.description}`
      ) // edit content in popup
      .openPopup(); // open popup
    console.log(trip);
  }
  _renderTrip(trip) {
    // use let to be able to use html again in if statement. We will insert this as a sibling element under form
    let html = `
      <li class="trip trip--${trip.type}" data-id="${trip.id}">
        <h2 class="trip__title">${trip.description}</h2>
        <div class="trip__details">
          <span class="trip__icon">${
            trip.type === 'freshwater' ? '💦' : '🧂'
          }</span>
          <span class="trip__value">${trip.coords}</span>
          <span class="trip__unit">lat, lng</span>
        </div>
        <div class="trip__details">
          <span class="trip__icon">🐟</span>
          <span class="trip__value">${trip.fish}</span>
          <span class="trip__unit">fish</span>
        </div>
    `;

    if (trip.type === 'freshwater' || trip.type === 'saltwater')
      html += `
        <div class="trip__details">
          <span class="trip__icon">📏</span>
          <span class="trip__value">${trip.size}</span>
          <span class="trip__unit">inches</span>
        </div>
        <div class="trip__details">
          <span class="trip__icon">🪝</span>
          <span class="trip__value">${trip.bait}</span>
          <span class="trip__unit">bait</span>
        </div>
      </li>
    `;
    form.insertAdjacentHTML('afterend', html);
  }

  _moveToPopup(e) {
    const tripEl = e.target.closest('.trip');

    if (!tripEl) return;

    const trip = this.#trips.find(trip => trip.id === tripEl.dataset.id);

    // read documents leaflet for setView method. after mapZoomLevel you can add a parameter options these options are from leaflet
    this.#map.setView(trip.coords, this.#mapZoomLevel, {
      animate: true,
      pan: {
        duration: 1,
      },
    });

    // using the public interface
    // trip.click();
  }
  // do not use local storage to store large amount of data
  _setLocalStoarage() {
    // browser provide an api we can use. trips is key and #trips is value
    localStorage.setItem('trips', JSON.stringify(this.#trips)); // convert any object in js to string
  }
  // get item from local storage
  _getLocalStorage() {
    //when you convert object to string and string back to object you lose all the inheritance from the parent class
    const data = JSON.parse(localStorage.getItem('trips')); // convert string to object

    // if there is no data in local storage
    if (!data) return;

    this.#trips = data;

    this.#trips.forEach(trip => {
      this._renderTrip(trip);
    });
  }
  // app.reset
  reset() {
    localStorage.removeItem('trips'); // remove the trips from localStorage
    location.reload(); // location is a method in browser that you can use like this to reload page
  }
}
// new app is created out of the class and stored in variable called app
const app = new App();

// Ability to edit a trip;
// Ability to delete a trip;
// Ability to delete all trips;
// Ability to sort trips by a certain field (e.g. size);
// Re-build Running and Cycling objects coming from local storage;
// More realistic error and confirmation messages;
/// Very hard
// Ability to position the map to show all trips. deep dive leaflet library
// Ability to draw lines and shapes instead of just points
//////////////// Advance
// use 3rd party api to plug in coordinates. description of location.
// Geocode location from coordinates (" Run in Faro, Portugal") [only after asynchronous JavaScript section]
// Display weather or trip time or place.
