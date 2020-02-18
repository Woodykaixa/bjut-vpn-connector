interface SiteInfo {
    title: string,
    url: string
}

const BjutSites: SiteInfo[] = [
    {
        title: chrome.i18n.getMessage('siteMyTitle'),
        url: 'https://my.bjut.edu.cn'
    },
    {
        title: chrome.i18n.getMessage('siteGdjwglTitle'),
        url: 'http://gdjwgl.bjut.edu.cn'
    },
    {
        title: chrome.i18n.getMessage('siteFanyaTitle'),
        url: 'http://bjut.fanya.chaoxing.com/portal'
    },
    {
        title: chrome.i18n.getMessage('siteLibTitle'),
        url: 'http://lib.bjut.edu.cn/'
    },
    {
        title: chrome.i18n.getMessage('siteMysvrTitle'),
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
                title: '北京工业大学' + site.title,
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