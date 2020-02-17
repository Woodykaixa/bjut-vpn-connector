interface SiteInfo {
    title: string,
    url: string
}

const BjutSites: SiteInfo[] = [
    {
        title: '北京工业大学信息门户',
        url: 'https://my.bjut.edu.cn'
    },
    {
        title: '北京工业大学教务系统',
        url: 'http://gdjwgl.bjut.edu.cn'
    },
    {
        title: '北京工业大学网络教学平台',
        url: 'http://bjut.fanya.chaoxing.com/portal'
    },
    {
        title: '北京工业大学图书馆',
        url: 'http://lib.bjut.edu.cn/'
    },
    {
        title: '北京工业大学网上办事',
        url: 'http://mysvr.bjut.edu.cn'
    }
]


export class SiteMenuCreator {
    id: string
    title: string
    constructor(id: string, title: string) {
        this.id = id
        this.title = title
    }

    createSiteMenu() {
        chrome.contextMenus.create({
            id: this.id,
            title: this.title
        })
        this.createSubMenu(BjutSites)
    }

    private createSubMenu(BjutSites: SiteInfo[]) {
        BjutSites.forEach((site) => {
            chrome.contextMenus.create({
                parentId: this.id,
                title: site.title,
                onclick: () => {
                    chrome.tabs.create({ url: site.url })
                }
            })
        });
    }

    removeSiteMenu() {
        chrome.contextMenus.remove(this.id)
    }
}