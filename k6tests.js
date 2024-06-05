import http from 'k6/http'
import { check, group } from 'k6'
import { randomItem } from 'https://jslib.k6.io/k6-utils/1.2.0/index.js'

const user_login = {
  "username": "aleksandram", 
  "password": "aleksandram",
  'userSession': ''
}

const flightParams = {

  'departCity': '',
  'arriveCity': '',
  'departDate': '', 
  'returnDate': '', 
  'seatPref': '',
  'seatType': '',
  'advanceDiscount': '0',
  'numPassengers': '1',
  'roundtrip': '', 
  'outboundFlight': ''

}

const user = {

  'lastName': 'Maiurova',
  'firstName': 'Aleksandra',
  'address1': '', 
  'address2': '', 
  'pass1': 'Aleksandra Maiurova',
  'creditCard': '123',
  'expDate': ''
}


const BASE_URL = 'http://webtours.load-test.ru:1080/cgi-bin'


export default function () {   
  

   group("RootPage", () => {

    RootPage()
    user['userSession'] = MainPage()

  })

  group("login", () => {

    login(user_login.userSession, user_login.username, user_login.password)
    RootMenu()

  })

  group("SelectFlights", () => {

    const {departCity, arriveCity} = Reservations()

    flightParams['departCity'] = departCity
    flightParams['arriveCity'] = arriveCity
    flightParams['departDate'] = new Date().toLocaleString('en-US', { timeZone: 'UTC' })
    flightParams['returnDate'] = new Date().toLocaleString('en-US', { timeZone: 'UTC' })
    flightParams['outboundFlight'] = ReservFlight(flightParams)
    selectFlight(flightParams)
    Payment(Object.assign({}, flightParams, user)) 

  })

}


export function RootPage(){

  
  const res = http.get(`${BASE_URL}/welcome.pl?signOff=true`)
  check(res, {
    'root page status is 200': res => res.status === 200
  })

}

export function MainPage(){

  
  const res = http.get(`${BASE_URL}/nav.pl?in=home`)
  check(res, {
    'MainPage status is 200': res => res.status === 200
  })

  const userSession = res.html().find('input[name="userSession"]').val()
  return userSession

}


export function login(userSession, username, password){

  const data = {
    'userSession': userSession,
    'username': username,
    'password': password
  }
  
  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    }
  }

  const res = http.post(`${BASE_URL}/login.pl`, data, headers)
  check(res, {
    'login status is 200': res => res.status === 200,
    'not_auth_error': (r) =>
        !r.body.includes("You've reached this page incorrectly (probably a bad user session value)")
    
  })

}

export function RootMenu(){


  const res = http.get(`${BASE_URL}/nav.pl?page=menu&in=home`)
  check(res, {
    'RootMenu status is 200': res => res.status === 200
  })

}


export function Reservations(){

  const res = http.get(`${BASE_URL}/reservations.pl?page=welcome`)
  check(res, {
    'Reservations status is 200': res => res.status === 200
  })

  let flightParams = {
    'departCity': '',
    'arriveCity': ''

  }

  flightParams['departCity'] = randomItem(res.html().find('select[name=depart]').children().map((idx, el) => el.val()))
  flightParams['arriveCity'] = randomItem(res.html().find('select[name=arrive]').children().map((idx, el) => el.val()))
  return flightParams

}

export function ReservFlight({advanceDiscount, departCity, departDate, arriveCity, returnDate, numPassengers, seatPref, seatType, roundtrip}){

  const data = {

    'advanceDiscount': advanceDiscount,
    'depart': departCity,
    'departDate': departDate,
    'arrive': arriveCity,
    'returnDate': returnDate,
    'numPassengers': numPassengers,
    'seatPref': seatPref,
    'seatType': seatType,
    'roundtrip': roundtrip,

    'findFlights.y': '43',
    'findFlights.x': '14',
    '.cgifields': ['roundtrip', 'seatType', 'seatPref']
  }

  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    }
  }

  const res = http.post(`${BASE_URL}/reservations.pl`, data, headers)
  check(res, {
    'Reservation status is 200': res => res.status === 200,
    'flight exist': res => res.html().find('input[name=outboundFlight]').first().val() !== undefined
  })

  const outboundFlight = randomItem(res.html().find('input[name=outboundFlight]').map((idx, el) => el.val()))

  return outboundFlight

}

export function selectFlight({outboundFlight, advanceDiscount, numPassengers, seatPref, seatType}){

  const data = {

    'outboundFlight': outboundFlight,
    'advanceDiscount': advanceDiscount,
    'numPassengers': numPassengers,
    'seatPref': seatPref,
    'seatType': seatType,

    'reserveFlights.x': '63',
    'reserveFlights.y': '6'
  }



  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    }
  }

  const res = http.post(`${BASE_URL}/reservations.pl`, data, headers)
  check(res, {
    'select flight status is 200': res => res.status === 200,
    'next page is open': res => res.html().find('Payment Details').text() !== undefined
  })

}

export function Payment({outboundFlight, advanceDiscount, numPassengers, seatPref, seatType, firsName, lastName, address1, address2, pass1, creditCard, expDate}){

  const data = {

    'outboundFlight': outboundFlight,
    'advanceDiscount': advanceDiscount,
    'numPassengers': numPassengers,
    'seatPref': seatPref,
    'seatType': seatType,
    'firstName': firsName,
    'lastName': lastName,
    'address1': address1,
    'address2': address2,
    'pass1': pass1,
    'creditCard': creditCard,
    'expDate': expDate
  }

  const headers = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7'
    }
  }

  const res = http.post(`${BASE_URL}/reservations.pl`, data, headers)
  check(res, {
    'Payment status is 200': res => res.status === 200,
    'Bill page is open': res => res.html().find('Invoice').text() !== undefined
  })

}