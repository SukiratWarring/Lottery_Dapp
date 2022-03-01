import { useState, useEffect } from 'react'
import Head from 'next/head'
import styles from '../styles/Home.module.css'
import 'bulma/css/bulma.css'
import Web3 from 'web3'
import lotterycontract from '../blockchain/lottery'

export default function Home() {
  const [web3, setweb3] = useState()
  const [address, setaddress] = useState()
  const [lcContract, setlcContract] = useState()
  const [lotteryPot, setlotteryPot] = useState()
  const [lotteryplayers, setplayers] = useState([])
  const [lotteryId, setlotteryId] = useState()
  const [error, setError] = useState('')
  const [lotteryHistory, setlotteryHistory] = useState([])
  const [successMsg, setSuccess] = useState('')


  useEffect(() => {
    updateState()
  }, [lcContract])

  const updateState=()=>{
    if (lcContract) getPot()//if lcContract present call getPot
    if (lcContract) getPlayers()
    if (lcContract) getlotteryId()
  }


  const getPot = async () => {
    const pot = await lcContract.methods.getBalance().call()
    setlotteryPot(web3.utils.fromWei(pot, 'ether'))
  }

  const getPlayers = async () => {
    const players = await lcContract.methods.getPlayers().call()
    setplayers(players)
  }
  const getHistory = async (id) => {
    setlotteryHistory([])
    for (let i = parseInt(id); i > 0; i--) {
      console.log('get history')
      const winneraddress = await lcContract.methods.lotteryHistory(i).call()
      const historyobject = {}
      historyobject.id = i
      historyobject.address = winneraddress
      setlotteryHistory(lotteryHistory => [...lotteryHistory, historyobject])
    }

  }
  const getlotteryId = async () => {
    const lotteryId = await lcContract.methods.lotteryId().call()
    console.log(lotteryId)
    setlotteryId(lotteryId)
    await getHistory(lotteryId)
    console.log(JSON.stringify(lotteryHistory))
  }

  const enterLotteryHandler = async () => {
    setError('')

    try {
      await lcContract.methods.enter().send({
        from: address,
        value: "15000000000000000",
        gas: 300000,
        gasPrice: null
      })
      updateState()
    } catch (err) {
      setError(err.message)

    }
  }
  const pickWinnerHandler = async () => {
    setError('')
    setSuccess('')
    console.log(`address from pickwinner :: ${address}`)
    try {
      await lcContract.methods.pickWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
    } catch (err) {
      setError(err.message)

    }
  }
  const paywinnerHandler= async()=>{
    setError('')
    setSuccess('')
    try {
      await lcContract.methods.payWinner().send({
        from: address,
        gas: 300000,
        gasPrice: null
      })
      const winneraddress = await lcContract.methods.lotteryHistory(lotteryId).call()
      setSuccess(`The winner is ${winneraddress}`)
      updateState()
    } catch (err) {
      setError(err.message)
    }
  }

  const connectwalletHandler = async () => {
    setError('')
    // check if metamsk is installed
    if (typeof window !== "undefined" && typeof window.ethereum !== 'undefined') {
      try {//request wallet connections
        await window.ethereum.request({ method: "eth_requestAccounts" })
        //create web3 instance & set web3
        const web3 = new Web3(window.ethereum)
        setweb3(web3)
        //get list of accounts
        const accounts = await web3.eth.getAccounts()
        //set account 1 to react state
        setaddress(accounts[0])
        //create local contract copy
        const lc = lotterycontract(web3)
        setlcContract(lc)
        window.ethereum.on('accountsChanged',async()=>{
          const accounts = await web3.eth.getAccounts()
              //set account 1 to react state
              setaddress(accounts[0])
        })
      } catch (err) { setError(err.message) }
    }
    else {
      //if not installed
      console.log('Please install Metamask')
    }
  }
  return (
    <div >
      <Head>
        <title>Ether Lottery</title>
        <meta name="description" content="Ethereum lottery Dapp" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <nav className='navbar mt-4 mb-4'>
          <div className='container'>
            <div className='navbar-brand'>
              <h1>Ether lottery</h1>
            </div>
            <div className='navbar-end'>
              <button className='button is-link' onClick={connectwalletHandler}>Connect</button>
            </div>
          </div>
        </nav>
        <div className='container'>
          <section className='mt-5'>
            <div className='columns'>
              <div className='column is-two-thirds'>
                <section className='mt-5'>
                  <p>Enter the lottery by sending 0.01 Ether</p>
                  <button onClick={enterLotteryHandler} className='button is-success is-large is-light mt-3'>Play Now</button>
                </section>
                <section className='mt-6'>
                  <p><b>Admin Only:</b> Pick Winner</p>
                  <button onClick={pickWinnerHandler} className='button is-primary is-large is-light mt-3'>Pick Winner</button>
                </section>
                <section className='mt-6'>
                  <p><b>Admin Only:</b>Pay Winner</p>
                  <button onClick={paywinnerHandler} className='button is-success is-large is-light mt-3'>Pay Winner</button>
                </section>
                <section>
                  <div className='container has-text-danger mt-6'>
                    <p>{error}</p>
                  </div>
                </section>
                <section>
                  <div className='container has-text-success mt-6'>
                    <p>{successMsg}</p>
                  </div>
                </section>
              </div>
              <div className='column is-one-thirds'>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Lottery History</h2>
                        {
                          (lotteryHistory && lotteryHistory.length > 0) && lotteryHistory.map(item => {
                            if (lotteryId != item.id) {
                              return <div className="history-entry mt-3" key={item.id}>
                                <div>Lottery #{item.id} winner:</div>
                                <div>
                                  <a href={`https://etherscan.io/address/${item.address}`} target="_blank">
                                    {item.address}
                                  </a>
                                </div>
                              </div>
                            }
                          })
                        }

                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Players ({lotteryplayers.length})</h2>
                        <ul>
                          {
                            (lotteryplayers && lotteryplayers.length > 0) && lotteryplayers.map((player, index) => {
                              return <li key={`${player}-${index}`}> <a href={`https://etherscan.io/address/${player}`} target="_blank">
                                {player}
                              </a>
                              </li>
                            })
                          }

                        </ul>
                      </div>
                    </div>
                  </div>
                </section>
                <section className='mt-5'>
                  <div className='card'>
                    <div className='card-content'>
                      <div className='content'>
                        <h2>Pot</h2>
                        <p>{lotteryPot} Ether</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>

          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2022 Sukirat Warring</p>
      </footer>
    </div>
  )
}
