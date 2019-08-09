/* global chrome, $ */
/*
  Made by KaiTiggy <hi@kaitiger.tech>
  -----------------------------------
  Licensed under Apache 2.0
  For full license details, see LICENSE
  Be nice and don't do jerk things with this code please
*/

const redeemDelay = 2000

const makeWalmartGC = (number, balance) => {
  const lastFour = number.slice(-4)
  const dollars = Math.floor(balance)
  const balString = balance.toFixed(2)
  const cents = balString.slice(-2)

  return `
    <li class="padded-card gift-card-wrapper no-margin Grid-col u-size-1-1 u-size-3-12-l u-size-4-12-m">
      <div class="gift-card-page" style="height: 208px;">
        <div class="GF-tile-wrapper">
          <div class="gift-card js-gift-card-tile">
            <span class="payment-option gift-card-images"></span>
            <div class="card-body">
              <div>
                <div class="gift-card-fullname" data-automation-id="gift-card-fullname-1"></div>
                <span class="gift-card-last-four" data-automation-id="gift-card-last-four-label-1"><span class="font-semibold">Gift Card <br></span><span>ending in <span data-automation-id="gift-card-last-four-1">${lastFour}</span></span><br><br></span>
              </div>
              <div data-automation-id="gift-card-balance-label-1" class="zero-balance gift-card-no-nickname-buttons"><span><span>Current value </span><span class="price balance gift-card-balance"><span class="price-group" role="text" aria-label="$${balString}"><span class="price-currency">$</span><span class="price-characteristic">${dollars}</span><span class="price-mark">.</span><span class="price-mantissa">${cents}</span></span></span></span></div>
              <div class="gift-card-history"><button class="button button--link" data-automation-id="open-gift-card-history" data-tl-id="button" type="button"><span class="button-wrapper">View card history</span></button></div>
              <div class="render-actions clearfix">
                <div class="pull-right m-margin-top"><button class="button button--link" data-automation-id="delete-gift-card-1" data-tl-id="delete1" arialabel="Delete GiftCard ending in 2484" type="button"><span class="button-wrapper">Delete</span></button></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </li>
  `
}

const makeWalmartAlert = (options) => `
  <div class="message active message-${options.type ? options.type : 'success'} message-block ${options.additionalClasses && options.additionalClasses.join(' ')}">
    <strong>${options.title ? options.title : 'Success!'}</strong>&nbsp;${options.message ? options.message : 'It worked.'}
  </div>
`

let extData = {}

const addCardToStorage = (card, callback) => {
  // save card to local storage
  extData.cards.push(card)
  extData.updated = new Date().toISOString()

  chrome.storage.local.set({ walmartCardData: extData }, callback)
}

const renderSaved = (cards) => {
  cards.forEach(card => {
    const savedCard = makeWalmartGC(card.number, card.balance)
    $('.gift-card-wrapper-inner ul.Grid').prepend(savedCard)
  })
}

$(document).ready(e => {
  let addedEvent = false
  let addedLocalCards = false

  // check for existing cards in local storage
  chrome.storage.local.get(['walmartCardData'], getExtData => {
    // if the object is empty
    if (Object.keys(getExtData).length === 0) {
      // initialize it
      const walmartCardData = {
        updated: new Date().toISOString(),
        cards: []
      }
      // save it to local storage
      chrome.storage.local.set({ walmartCardData }, () => {
        extData = walmartCardData
      })
    } else {
      // save it to global
      extData = getExtData.walmartCardData
    }
  })

  // Watch the wrapper for changes, essentially replaces $(document).ready()
  $('body').on('DOMSubtreeModified', '.js-content', function () {
    // Once the grid is added, parse localStorage cards
    if ($('ul.Grid').length > 0 && !addedLocalCards) {
      addedLocalCards = true
      renderSaved(extData.cards)
    }

    // Once the form is added, add our click event
    if ($('.submit-save-gift-card').length > 0 && !addedEvent) {
      addedEvent = true
      $('.submit-save-gift-card').click(e => {
        e.preventDefault()
        $('.submit-save-gift-card').attr('disabled', 'disabled')

        // get card number and pin DOM elements
        const cardNumInput = $('input[data-automation-id="enter-gift-card-number"]')
        const cardNumError = $('span[data-automation-id="enter-gift-card-number-error"]')
        const cardPinInput = $('input[data-automation-id="enter-gift-card-pin"]')
        const cardPinError = $('span[data-automation-id="enter-gift-card-pin-error"]')

        /*
          NOTE: Walmart cards are only numbers
          So if we want to allow for dynamic values, we have to live within
          the confines of number-only cards, so we wouldn't be able to make it
          the same as the Google Play redemption
        */
        const cardBalance = 500.00 // constant for now, could make it dynamic

        // check for errors
        if (cardNumError.text().length === 0 && // If no errors w/ card number
          cardNumInput.val().length === 16 && // If valid card number
          cardPinError.text().length === 0 && // If no PIN errors
          cardPinInput.val().length === 4) { // If valid PIN
          // wait for a bit before continuing
          setTimeout(() => {
            // generate a card string
            const card = makeWalmartGC(cardNumInput.val(), cardBalance)

            // save the card to local storage
            addCardToStorage({
              number: cardNumInput.val(),
              balance: cardBalance
            }, () => {
              // add it to the screen like a hacker
              $('.gift-card-wrapper-inner ul.Grid').prepend(card)
              $('.submit-save-gift-card').removeAttr('disabled')

              // make and display success message
              const message = makeWalmartAlert({
                title: 'Gift Card Successfully Redeemed!',
                message: `$${cardBalance.toFixed(2)} has been added to your account`
              })
              $('.gift-card-wrapper-inner .u-size-9-12-m').first().append(message)

              // scroll to the top just for some flair
              $('html, body').animate({ scrollTop: '0px' })
            })
          }, redeemDelay)
        }
      })
    }
  })
})
