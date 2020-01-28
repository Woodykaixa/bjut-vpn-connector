let id = document.getElementById('studentId')
let pwd = document.getElementById('password')
let connectingBox = document.getElementById('statusConnecting')

const msg = (type, content) => {
    return {
        type: type,
        content: content
    }
}

const queryConnectionStatus = () => {
    chrome.runtime.sendMessage(msg('query', { what: 'connection status' }), (response) => {
        if (response.msg === 'connecting') {
            connectingBox.style.removeProperty('display')
        }
    })
}

document.getElementById('connect').addEventListener('click', () => {
    document.getElementById('statusConnecting').style.removeProperty('display')
    let loginInfo = {
        id: id.value,
        pwd: pwd.value
    }
    let c = 10
    alert(loginInfo.id + ' ' + loginInfo.pwd + '\n第' + c + '次测试')
    chrome.runtime.sendMessage(msg('login', loginInfo), (response) => {
        alert(response.msg)
    })
})

document.addEventListener('DOMContentLoaded', () => {
    queryConnectionStatus()
})