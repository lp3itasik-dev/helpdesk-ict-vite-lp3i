import { useEffect, useState, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import Lottie from 'lottie-react';
import axios from 'axios';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import QRCode from 'qrcode';
import moment from 'moment-timezone';
import chatAnimation from '../assets/chat-animation.json';
import Man from '../assets/man.png'
import Custom from '../assets/custom.png'
import Secret from '../assets/secret.png'
import BellSound from '../assets/bell.mp3'
import Doodle from '../assets/doodle.png'
import { socket } from '../socket'

gsap.registerPlugin(useGSAP);

const Admin = () => {
  const navigate = useNavigate();

  const containerSend = useRef(null);
  const containerAuth = useRef(null);

  const [rooms, setRooms] = useState([]);
  const [chats, setChats] = useState([]);
  const [connection, setConnection] = useState(false);
  const [searchParams] = useSearchParams();

  const client = 'Administrator';
  const [activeRoom, setActiveRoom] = useState(null);

  const [enableRoom, setEnableRoom] = useState(false);
  const [logged, setLogged] = useState(false);
  const [username, setUsername] = useState(searchParams.get("username") || '');
  const [password, setPassword] = useState(searchParams.get("password") || '');
  const [token, setToken] = useState(searchParams.get("token") || '');
  const [replyMessage, setReplyMessage] = useState('');
  const [message, setMessage] = useState('');
  const [canSendMessage, setCanSendMessage] = useState(true);

  const Authentication = () => {
    const room = localStorage.getItem('HELPDESK:room_admin');
    const account = localStorage.getItem('HELPDESK:account_admin');
    if (account) {
      if (!room) {
        localStorage.removeItem('HELPDESK:room_admin');
        localStorage.removeItem('HELPDESK:account_admin');
        setLogged(false);
        navigate('/admin')
      } else {
        const roomStorage = localStorage.getItem('HELPDESK:room_admin');
        const roomActive = JSON.parse(roomStorage);
        getChats(roomActive);
        setActiveRoom(roomActive);
        getRooms();
        setLogged(true)
      }
    }
  }

  const getRooms = async () => {
    await axios.get(`${import.meta.env.VITE_BACKEND}/rooms`, {
      headers: {
        'api-key': 'bdaeaa3274ac0f2d'
      }
    })
      .then((response) => {
        setRooms(response.data);
      })
      .catch((error) => {
        console.log(error);
      })
  }

  const clearChats = async () => {
    const confirmed = confirm(`Apakah anda yakin akan menghapus pesan ${activeRoom.name}?`);
    if (confirmed) {
      await axios.delete(`${import.meta.env.VITE_BACKEND}/chats/${activeRoom.token}`, {
        headers: {
          'api-key': 'bdaeaa3274ac0f2d'
        }
      })
        .then((response) => {
          alert(response.data.message);
          getChats(activeRoom);
        })
        .catch((error) => {
          console.log(error);
        })
    }
  }

  const getChats = async (roomActive) => {
    await axios.get(`${import.meta.env.VITE_BACKEND}/chats/admin/${roomActive.token}`, {
      headers: {
        'api-key': 'bdaeaa3274ac0f2d'
      }
    })
      .then((response) => {
        const responseChat = response.data;
        setChats(responseChat);
      })
      .catch((error) => {
        if (error.response.status == 404) {
          setChats([]);
        }
      })
  }

  const changeRoom = (name, token, type, secret) => {
    let data = {
      name: name,
      token: token,
      type: type,
      secret: secret,
    }
    localStorage.setItem('HELPDESK:room_admin', JSON.stringify(data));
    Authentication();
  }

  const manualRoom = () => {
    const inputManual = prompt('TOKEN CUSTOM\nIsi token ruangan yang ingin diakses, contoh: 46155')
    if (inputManual) {
      let data = {
        name: 'Custom',
        token: inputManual,
        type: true,
        secret: false,
      }
      localStorage.setItem('HELPDESK:room_admin', JSON.stringify(data));
      Authentication();
    }
  }

  const secretRoom = () => {
    const inputManual = prompt('TOKEN SECRET\nIsi token ruangan yang ingin diakses, contoh: 46122')
    if (inputManual) {
      let data = {
        name: 'Secret',
        token: inputManual,
        type: true,
        secret: true,
      }
      localStorage.setItem('HELPDESK:room_admin', JSON.stringify(data));
      Authentication();
    }
  }

  const removeToken = () => {
    const logoutPrompt = confirm('Apakah anda yakin akan keluar?');
    if (logoutPrompt) {
      localStorage.removeItem('HELPDESK:room_admin');
      localStorage.removeItem('HELPDESK:account_admin');
      setLogged(false);
      navigate('/admin')
    }
  }

  const sendMessage = async (e) => {
    e.preventDefault();
    const accountStringify = localStorage.getItem('HELPDESK:account_admin');
    const roomStringify = localStorage.getItem('HELPDESK:room_admin');
    if (accountStringify && roomStringify) {
      const accountParse = JSON.parse(accountStringify);
      const roomParse = JSON.parse(roomStringify);
      const dataChat = {
        client: accountParse.name,
        name_room: roomParse.name,
        token: roomParse.token,
        not_save: roomParse.secret,
        uuid_sender: accountParse.uuid,
        name_sender: accountParse.name,
        role_sender: accountParse.role,
        message: message,
        reply: replyMessage,
        date: new Date(),
        latitude: null,
        longitude: null
      }
      setCanSendMessage(false);
      socket.emit('message', dataChat)
      setMessage('');
      setTimeout(() => {
        setCanSendMessage(true);
      }, 2000);
    }
  }

  const scrollToRef = () => {
    if (containerSend.current) {
      if (containerSend.current) {
        const currentScroll = containerSend.current.scrollHeight;
        containerSend.current.scrollTo({
          top: currentScroll,
          behavior: 'smooth'
        });
      }
    }
  };

  const bellPlay = () => {
    let audio = new Audio(BellSound);
    audio.play();
  }

  const createRoom = async () => {
    const roomName = prompt('Nama Ruangan\nIsi nama room chat yang ingin dibuat, contoh: Divisi IT');
    if (roomName) {
      const roomToken = prompt('Token Ruangan\nIsi token ruangan yang ingin dibuat, contoh: 46155');
      if (roomToken) {
        const data = {
          name: roomName,
          token: roomToken,
          type: false,
          secret: false,
        }
        await axios.post(`${import.meta.env.VITE_BACKEND}/rooms`, data, {
          headers: { 'api-key': 'bdaeaa3274ac0f2d' }
        })
          .then((response) => {
            alert(response.data.message);
            getRooms();
          })
          .catch(() => {
            alert(`Gagal membuat ruangan baru!`);
          });
      }
    }
  }

  const deleteRoom = async (room) => {
    const confirmed = prompt(`Hapus Ruangan\nMasukkan token ruangan yang ingin dihapus, contoh: ${room.token}`);
    if (confirmed) {
      await axios.delete(`${import.meta.env.VITE_BACKEND}/rooms/${room.token}`, {
        headers: { 'api-key': 'bdaeaa3274ac0f2d' }
      })
        .then((response) => {
          alert(response.data.message);
          changeRoom('Utama', '46150', true, false);
        })
        .catch((error) => {
          if (error.message.includes("Invalid URI")) {
            alert("Gagal membuat QR Code: URL tidak valid!");
          } else if (error.message.includes("NetworkError")) {
            alert("Gagal: Periksa koneksi internet Anda.");
          } else if (error.message.includes("QuotaExceededError")) {
            alert("Gagal: Penyimpanan browser penuh, coba hapus cache.");
          } else {
            alert(`Terjadi kesalahan: ${error.response.data.message}`);
          }
        });
    }
  }

  const generateQRcode = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_BACKEND}/users/auto`, {
        headers: { 'api-key': 'bdaeaa3274ac0f2d' }
      });
      const name = prompt("QR Code\nIsi data yang ingin dijadikan QR Code, contoh: Lab Komputer 4");
      if (name) {
        const autologin = prompt("Auto Login\njika setuju, isi 'yes' untuk login otomatis, jika tidak, isi 'no'");
        if (autologin && autologin.toLocaleLowerCase() === 'yes') {
          const room = localStorage.getItem('HELPDESK:room_admin');
          if (room) {
            QRCode.toDataURL(`${import.meta.env.VITE_FRONTEND}?room=${encodeURI(name)}&username=${response.data.username}&password=${response.data.password}&token=${encodeURI(JSON.parse(room).token)}`, {
              scale: 50,
            }, function (err, url) {
              if (err) {
                return alert('QR Code gagal dibuat!');
              }
              const a = document.createElement("a");
              a.href = url;
              a.download = `HelpdeskICT-${name.replace(/\s+/g, "_")}-${JSON.parse(room).name}-autologin.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
          }
        } else {
          const room = localStorage.getItem('HELPDESK:room_admin');
          if (room) {
            QRCode.toDataURL(`${import.meta.env.VITE_FRONTEND}?room=${encodeURI(name)}&token=${encodeURI(JSON.parse(room).token)}`, {
              scale: 50,
            }, function (err, url) {
              if (err) {
                return alert('QR Code gagal dibuat!');
              }
              const a = document.createElement("a");
              a.href = url;
              a.download = `HelpdeskICT-${name.replace(/\s+/g, "_")}-${JSON.parse(room).name}.png`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
            });
          }
        }
      }
    } catch (error) {
      console.error("Error fetching QR code:", error);
      if (error.response) {
        console.error("Response Data:", error.response.data);
        console.error("Status Code:", error.response.status);
        console.error("Headers:", error.response.headers);
        alert(`Terjadi kesalahan! Server mengembalikan kode ${error.response.status}`);
      } else if (error.request) {
        console.error("No response received:", error.request);
        alert("Gagal menghubungi server! Periksa koneksi internet Anda.");
      } else {
        console.error("Error Message:", error.message);
        alert("Terjadi kesalahan tidak terduga!");
      }
    }
  }

  const autoLogin = () => {
    if (username && password && token) {
      setTimeout(() => {
        loginFunc();
      }, 2000);
    }
  }

  const loginFunc = async (e) => {
    if (e && e.preventDefault) {
      e.preventDefault();
    }
    try {
      const responseUser = await axios.post(`${import.meta.env.VITE_BACKEND}/auth/admin/login`, {
        username: username,
        password: password
      }, {
        headers: {
          'api-key': 'bdaeaa3274ac0f2d'
        }
      });
      const responseRoom = await axios.get(`${import.meta.env.VITE_BACKEND}/rooms/${token}`, {
        headers: {
          'api-key': 'bdaeaa3274ac0f2d'
        }
      })
      const dataUser = responseUser.data;
      const dataRoom = responseRoom.data;

      let dataHelpdeskRoom = {
        name: dataRoom.name,
        token: dataRoom.token,
        type: dataRoom.type,
        secret: dataRoom.secret,
      }

      let dataHelpdeskAccount = {
        name: dataUser.name,
        uuid: dataUser.uuid,
        role: dataUser.role
      }

      localStorage.setItem('HELPDESK:room_admin', JSON.stringify(dataHelpdeskRoom));
      localStorage.setItem('HELPDESK:account_admin', JSON.stringify(dataHelpdeskAccount));
      setLogged(true);
      Authentication();
    } catch (err) {
      console.log(err);
      alert(err.response.data.message);
    }
  }

  useEffect(() => {
    Authentication();
    autoLogin();

    setTimeout(() => {
      scrollToRef();
    }, 1000);

    function onConnect() {
      console.log('Connected!');
      setConnection(true);
    }

    function onDisconnect() {
      console.log('Disconnected!');
      setConnection(false);
    }

    function onMessage(message) {
      const roomStringify = localStorage.getItem('HELPDESK:room_admin');
      if (roomStringify) {
        const roomParse = JSON.parse(roomStringify);
        if (message.token == roomParse.token) {
          setChats(prevChat => [...prevChat, message]);
          setTimeout(() => {
            scrollToRef();
            if (message.role_sender == 'S') {
              bellPlay();
            }
          }, 100);
        }
      }
    }

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('message', onMessage);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('message', onMessage);
    };
  }, []);

  useEffect(() => {
    if (logged && containerSend.current) {
      gsap.from('#container-account', {
        duration: 3,
        y: -800,
        rotation: -180,
        delay: 0.5,
        ease: "elastic.out(1,0.3)"
      });
      gsap.from('#container-chat', {
        duration: 1,
        y: -800,
        opacity: 0,
        delay: 3,
      });
      gsap.from('#container-setting', {
        duration: 3,
        y: -800,
        rotation: -180,
        delay: 0.8,
        ease: "elastic.out(1,0.3)"
      });
      gsap.from('#container-message', {
        duration: 3,
        y: -2000,
        rotation: -180,
        delay: 1.1,
        ease: "elastic.out(1,0.3)"
      });
    }

    if (!logged && containerAuth.current) {
      gsap.fromTo('#auth-title', {
        opacity: 0,
        rotate: 50,
        y: -50,
        transformOrigin: 'left top'
      }, {
        opacity: 1,
        y: 0,
        duration: 2,
        rotate: 0,
        delay: 0,
        ease: "elastic.out(1,0.3)",
      });
      gsap.fromTo('#auth-description', {
        opacity: 0,
        rotate: 50,
        y: -50,
        transformOrigin: 'right top'
      }, {
        opacity: 1,
        y: 0,
        duration: 2,
        rotate: 0,
        delay: 0.2,
        ease: "elastic.out(1,0.3)"
      });
      gsap.fromTo('#auth-status', {
        opacity: 0,
        rotate: 60,
        y: -100,
        transformOrigin: 'center top'
      }, {
        opacity: 1,
        y: 0,
        duration: 2,
        rotate: 0,
        delay: 0.4,
        ease: "elastic.out(1,0.3)"
      });
      gsap.fromTo('#auth-form', {
        opacity: 0,
        y: -200,
        transformOrigin: 'center top'
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.5,
      });
      gsap.fromTo('#copyright', {
        opacity: 0,
        y: -200,
        transformOrigin: 'center top'
      }, {
        opacity: 1,
        y: 0,
        duration: 1,
        delay: 0.6,
      });
    }
  }, [logged]);

  return (
    <main className={`relative bg-[#EDEDED]`}>
      {
        logged ? (
          <section ref={containerSend} className='flex flex-col overflow-y-auto h-screen pt-26 py-60'>

            <div className="absolute inset-0 bg-cover bg-center opacity-3 z-0 h-screen" style={{ backgroundImage: `url(${Doodle})` }}></div>
            <div className='fixed w-11/12 flex items-start justify-between gap-5 mx-auto z-10 top-5 left-0 right-0'>
              <div id='container-account' onClick={() => rooms.length > 0 && setEnableRoom(!enableRoom)} className={`${connection ? 'bg-emerald-500 border-emerald-700/30' : 'bg-red-500 border-red-700/30'} text-white drop-shadow  rounded-2xl border-b-4 px-5 py-3 flex items-center gap-2 cursor-pointer`}>
                <i className={`fi fi-rr-user-headset text-sm flex ${connection ? 'bg-emerald-600' : 'bg-red-600'} p-2 rounded-lg`}></i>
                <h1 className='font-bold text-xs'>{activeRoom.name}: {client}</h1>
                {
                  rooms.length > 0 &&
                  <i className="fi fi-rr-dropdown-select flex"></i>
                }
              </div>
              {
                rooms.length > 0 && enableRoom && (
                  <div className={`absolute bg-white text-gray-900 drop-shadow  rounded-2xl border-b-4 border-gray-300 px-5 py-3 grid grid-cols-3 items-center gap-2 top-18`}>
                    {rooms.map((roomItem) => (
                      <button
                        key={roomItem.id}
                        type="button"
                        onClick={() => changeRoom(roomItem.name, roomItem.token, roomItem.type, roomItem.secret)}
                        className="cursor-pointer w-auto flex flex-col items-center space-y-1 p-1 md:p-0"
                      >
                        <div className="w-full flex flex-col items-center justify-center gap-1">
                          <div
                            className="w-10 h-10 bg-cover bg-center"
                            style={{ backgroundImage: `url(${Man})` }}
                          ></div>
                          <h4 className="text-xs text-gray-800 font-medium">{roomItem.name}</h4>
                        </div>
                      </button>
                    ))}

                    <button
                      type="button"
                      onClick={manualRoom}
                      className="cursor-pointer w-auto flex flex-col items-center space-y-1 p-1 md:p-0"
                    >
                      <div className="w-full flex flex-col items-center justify-center gap-1">
                        <div className="w-10 h-10 bg-cover bg-center" style={{ backgroundImage: `url(${Custom})` }}></div>
                        <h4 className="text-xs text-gray-800 font-medium">Manual</h4>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={secretRoom}
                      className="cursor-pointer w-auto flex flex-col items-center space-y-1 p-1 md:p-0"
                    >
                      <div className="w-full flex flex-col items-center justify-center gap-1">
                        <div className="w-10 h-10 bg-cover bg-center" style={{ backgroundImage: `url(${Secret})` }}></div>
                        <h4 className="text-xs text-gray-800 font-medium">Secret</h4>
                      </div>
                    </button>
                  </div>
                )
              }

              <div id='container-setting' className='bg-white border-b-4 border-gray-300 drop-shadow rounded-2xl px-5 py-3.5 flex flex-col justify-center items-center gap-4'>
                <button type='button' onClick={scrollToRef} className={`${connection ? 'text-emerald-500' : 'text-red-500'} cursor-pointer`}>
                  <i className="fi fi-rr-wifi flex text-sm"></i>
                </button>
                <button onClick={removeToken} type='button' className='cursor-pointer text-red-700 hover:text-red-800'>
                  <i className="fi fi-rr-key flex text-sm"></i>
                </button>
                <a href={`${import.meta.env.VITE_BACKEND}/chats/download/${activeRoom.token}`} target='_blank' className='cursor-pointer text-sky-700 hover:text-sky-800'>
                  <i className="fi fi-rr-download flex text-sm"></i>
                </a>
                <button onClick={() => generateQRcode()} type='button' className='cursor-pointer text-sky-700 hover:text-sky-800'>
                  <i className="fi fi-rr-qrcode flex text-sm"></i>
                </button>
                <button onClick={() => createRoom()} type='button' className='cursor-pointer text-sky-700 hover:text-sky-800'>
                  <i className="fi fi-rr-smart-home flex text-sm"></i>
                </button>
                <button onClick={() => bellPlay()} type='button' className='cursor-pointer text-sky-700 hover:text-sky-800'>
                  <i className="fi fi-rr-bell-ring flex text-sm"></i>
                </button>
                <button onClick={clearChats} type='button' className='cursor-pointer text-red-700 hover:text-red-800'>
                  <i className="fi fi-rr-trash flex text-sm"></i>
                </button>
                <button onClick={() => deleteRoom(activeRoom)} type='button' className='cursor-pointer text-red-700 hover:text-red-800'>
                  <i className="fi fi-rr-smart-home flex text-sm"></i>
                </button>
              </div>
            </div>

            <div id='container-chat' className="px-5 flex flex-col gap-3">
              {chats.length > 0 && chats.map((chat, index) => (
                <div key={index}>
                  {chat.client.toLowerCase() === client.toLowerCase() ? (
                    <div className="flex justify-end">
                      <div className="relative w-10/12 md:w-7/12">
                        <div className='space-y-2'>
                          <div className='relative shadow bg-blue-500 p-4 pb-10 rounded-2xl'>
                            <p className='text-white text-sm'>{chat.message}</p>
                            <small className='absolute right-4 bottom-3 text-[11px] text-blue-400'>
                              {moment(chat.date).tz('Asia/Jakarta').format('llll')}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-start gap-3">
                      <div className="relative w-10/12">
                        <div className='space-y-2 cursor-pointer' onClick={() => setReplyMessage(chat.client)}>
                          <div className='relative bg-white shadow p-4 pb-10 rounded-2xl'>
                            <h5 className='text-gray-900 text-xs font-bold mb-2'>Ruang {chat.client}</h5>
                            <p className='text-gray-900 text-sm'>{chat.message}</p>
                            <i className="fi fi-rr-undo flex text-[11px] absolute left-4 bottom-4 opacity-20"></i>
                            <small className='absolute right-4 bottom-3 text-[11px] text-gray-400'>
                              {moment(chat.date).tz('Asia/Jakarta').format('llll')}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div id='container-message' className='fixed bg-white border-b-8 border-sky-800 p-5 drop-shadow-xl w-11/12 md:w-full max-w-lg mx-auto bottom-3 left-0 right-0 rounded-3xl space-y-3 flex flex-col items-center justify-center'>
              <form onSubmit={sendMessage} className="w-full flex gap-2 max-w-lg mx-auto">
                <div className='w-full flex flex-col gap-1'>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <i className={`fi fi-rr-${canSendMessage ? 'smart-home' : 'stopwatch'} text-gray-500`}></i>
                    </div>
                    <input type="text" value={replyMessage} onChange={(e) => setReplyMessage(e.target.value)} className={`${canSendMessage ? 'bg-gray-50' : 'bg-gray-200'} border border-gray-300 text-gray-900 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5`} placeholder='Ruangan' required disabled={!canSendMessage} autoFocus={true} />
                  </div>
                  <div className="relative w-full">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-3 pointer-events-none">
                      <i className={`fi fi-rr-${canSendMessage ? 'comment' : 'stopwatch'} text-gray-500`}></i>
                    </div>
                    <input type="text" value={message} onChange={(e) => setMessage(e.target.value)} className={`${canSendMessage ? 'bg-gray-50' : 'bg-gray-200'} border border-gray-300 text-gray-900 text-xs rounded-xl focus:ring-blue-500 focus:border-blue-500 block w-full ps-10 p-2.5`} placeholder={`${canSendMessage ? 'Tulis pesan disini...' : 'Tolong ditunggu selama 2 detik!'}`} required disabled={!canSendMessage} autoFocus={true} />
                  </div>
                </div>
                {
                  canSendMessage &&
                  <button type="submit" className="flex gap-2 items-center justify-center py-2.5 px-4 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-blue-300">
                    <i className="flex fi fi-rr-paper-plane"></i>
                  </button>
                }
              </form>
              <div className='w-full text-center max-w-sm space-y-2'>
                <p className='text-[11px] text-gray-500 text-center'>Harap berikan deskripsi masalah yang jelas kepada tim ICT kami, sehingga kami dapat memberikan solusi yang tepat.</p>
                <Link to={`/license`} target='_blank' className='block text-[11px] text-gray-700'>© {new Date().getFullYear()} Lerian Febriana. All Rights Reserved.</Link>
              </div>
            </div>

          </section>
        ) : (
          <section ref={containerAuth} className='relative bg-sky-800 flex flex-col items-center justify-center h-screen overflow-y-auto'>
            <div className="absolute inset-0 bg-cover bg-center opacity-10 z-0" style={{ backgroundImage: `url(${Doodle})` }}></div>
            <Lottie animationData={chatAnimation} loop={true} className='w-1/3 md:w-1/6' />
            <div className='text-center space-y-5 z-10'>
              <div className='space-y-1'>
                <h2 id="auth-title" className='font-bold text-2xl text-white'>Admin Helpdesk Chat</h2>
                <p id="auth-description" className='text-sm text-sky-200'>Make simple chat for quick problem solving.</p>
              </div>
              <p id="auth-status" className={`${connection ? 'bg-emerald-500' : 'bg-red-500'} text-white text-xs py-2 rounded-xl`}>
                <i className="fi fi-rr-wifi text-[12px] mr-1"></i>
                <span>{`${connection ? 'Connected' : 'Disconnected'}`}</span>
              </p>
              <form id="auth-form" onSubmit={loginFunc} className='flex flex-col items-center gap-2'>
                <input type="text" id='username' value={username} onChange={(e) => setUsername(e.target.value)} placeholder='Username' className='bg-sky-100 text-sky-900 text-sm rounded-xl block w-full px-4 py-2.5 border border-sky-800 focus:ring-sky-500 focus:border-sky-500' required />
                <input type="password" id='password' value={password} onChange={(e) => setPassword(e.target.value)} placeholder='Password' className='bg-sky-100 text-sky-900 text-sm rounded-xl block w-full px-4 py-2.5 border border-sky-800 focus:ring-sky-500 focus:border-sky-500' required />
                <input type="number" id='token' value={token} onChange={(e) => setToken(e.target.value)} placeholder='Token' className='bg-sky-100 text-sky-900 text-sm rounded-xl block w-full px-4 py-2.5 border border-sky-800 focus:ring-sky-500 focus:border-sky-500' required />
                <button type="submit" className="w-full flex gap-2 items-center justify-center py-2.5 px-3 text-sm font-medium text-white bg-sky-600 rounded-xl hover:bg-sky-700 focus:ring-4 focus:outline-none focus:ring-blue-300 transition-all ease-in-out cursor-pointer">
                  <span>Sign In</span>
                </button>
              </form>
              <Link to={`/license`} target='_blank' id='copyright' className='block text-xs text-sky-400'>© {new Date().getFullYear()} Lerian Febriana. All Rights Reserved.</Link>
            </div>
          </section>
        )
      }
    </main>
  )
}

export default Admin