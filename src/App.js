import 'regenerator-runtime/runtime'
import React from 'react'
import { login, logout } from './utils'
import './global.css'
import BN from 'bn.js';

import getConfig from './config'
const { networkId } = getConfig('mainnet')

import banner from './Artboard_1.png'

export default function App() {
  // use React Hooks to store greeting in component state
  const [totalMinted, setTotalMinted] = React.useState()

  // when the user has not yet interacted with the form, disable the button
  const [buttonDisabled, setButtonDisabled] = React.useState(true)

  // after submitting the form, we want to show Notification
  const [showNotification, setShowNotification] = React.useState(false)

  // The useEffect hook can be used to fire side-effects during render
  // Learn more: https://reactjs.org/docs/hooks-intro.html
  React.useEffect(
    () => {
      // in this case, we only care to query the contract when signed in
      if (window.walletConnection.isSignedIn()) {

        // window.contract is set by initContract in index.js
        window.contract.nft_total_supply({})
          .then(totalMintedFromContract => {
            setTotalMinted(totalMintedFromContract)
            setButtonDisabled(false)
          })

      }
    },

    // The second argument to useEffect tells React when to re-run the effect
    // Use an empty array to specify "only run on first render"
    // This works because signing into NEAR Wallet reloads the page
    []
  )

  // if not signed in, return early with sign-in prompt
  if (!window.walletConnection.isSignedIn()) {
    return (
      <main>
        <img className='banner1' src={banner}/>

        <p style={{ textAlign: 'center', marginTop: '2.5em' }}>
          <button onClick={login}>Sign in</button>
        </p>
      </main>
    )
  }

  return (
    // use React Fragment, <>, to avoid wrapping elements in unnecessary divs
    <>
      <button className="link" style={{ float: 'right' }} onClick={logout}>
        Sign out
      </button>
      <main>

        <img className='banner' src={banner}/>

        <p style={{marginTop:50}}>
          Building NEAR's first casino.<br/> 
          Sharing 100% of the profits from the casino with our holders.
        </p>

        <p className='bold smallText'>
          {window.accountId}
        </p>

        <p className='smallText'>
          Total minted:  {totalMinted}
        </p>
        <p className='smallText'>
          Supply:  {1000}
        </p>
        <form onSubmit={async event => {
          event.preventDefault()

          // get elements from the form using their id attribute
          const { fieldset } = event.target.elements

          // disable the form while the value gets updated on-chain
          fieldset.disabled = true

          try {
            // make an update call to the smart contract
            await window.contract.nft_mint({
              // pass the value that the user entered in the greeting field
              receiver_id: window.accountId
            },
            100000000000000,
            new BN('5000000000000000000000000', 10) // attached deposit in yoctoNEAR (optional)
            )
          } catch (e) {
            alert(
              'Something went wrong! ' +
              'Maybe you need to sign out and back in? ' +
              'Check your browser console for more info.'
            )
            throw e
          } finally {
            // re-enable the form, whether the call succeeded or failed
            fieldset.disabled = false
          }

          // update local `greeting` variable to match persisted value
          setTotalMinted(await window.contract.nft_total_supply({}))

          // show Notification
          setShowNotification(true)

          // remove Notification again after css animation completes
          // this allows it to be shown again next time the form is submitted
          setTimeout(() => {
            setShowNotification(false)
          }, 11000)
        }}>
          <fieldset id="fieldset">
            <div style={{ display: 'flex' }}>
              <button
                disabled={buttonDisabled}
                style={{ borderRadius: '5px' }}
              >
                Mint
              </button>
            </div>
          </fieldset>
        </form>
        
      </main>
      {showNotification && <Notification />}
    </>
  )
}

// this component gets rendered by App after the form is submitted
function Notification() {
  const urlPrefix = `https://explorer.${networkId}.near.org/accounts`
  return (
    <aside>
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.accountId}`}>
        {window.accountId}
      </a>
      {' '/* React trims whitespace around tags; insert literal space character when needed */}
      called method: 'nft_mint' in contract:
      {' '}
      <a target="_blank" rel="noreferrer" href={`${urlPrefix}/${window.contract.contractId}`}>
        {window.contract.contractId}
      </a>
      <footer>
        <div>✔ Succeeded</div>
        <div>Just now</div>
      </footer>
    </aside>
  )
}
