import puppeteer from 'puppeteer';

const evalPage = (): { beta: any[], images: any[] } => {
    // Functions have to be defined inside evalPage() because it is being run in a browser context and can't reference other functions
    const getHeaderTitle = (childNodes: NodeListOf<ChildNode>): string | void => {
        for (let i = 0; i < childNodes.length; i++) {
            const child: ChildNode | undefined = childNodes[i];
            if (child && child.textContent && child.textContent.length > 0) return child.textContent;
        }
    }

    let currentBeta: any | null = null;
    const parseChildNodes = (childNodes: NodeListOf<ChildNode>) => {
        childNodes.forEach((child: ChildNode) => {
            switch (child.nodeName) {
                case 'H2':
                    // Start of a new beta section
                    if (currentBeta) beta.push(currentBeta);
                    const title = getHeaderTitle(child.childNodes);
                    currentBeta = title ? {
                        title,
                        text: ''
                    } : null;
                    break;
                case 'A':
                case 'B':
                case 'I':
                case 'P':
                case 'S':
                case 'U':
                case 'FONT':
                    if (!currentBeta) break;
                    currentBeta.text += (child as Element).outerHTML;
                    break;
                case '#text':
                    if (!currentBeta) break;
                    if (child.nodeValue !== '\n') currentBeta.text += child.nodeValue;
                    break;
                case 'LI':
                    if (!currentBeta) break;
                    if ((child as Element).className === 'gallerybox') parseGalleryBoxImage((child as Element));
                    else {
                        currentBeta.text += '<li>';
                        // We want to exclude things like images from being included in the html text, so recursively call this function instead of .outerHtml
                        parseChildNodes(child.childNodes); 
                        currentBeta.text += '</li>\n';
                    }
                    break;
                case 'UL':
                    if (!currentBeta) break;
                    if ((child as Element).className !== 'gallery') currentBeta.text += '<ul>';
                    parseChildNodes(child.childNodes);
                    if ((child as Element).className !== 'gallery') currentBeta.text += '</ul>\n';
                    break;
                default:
                    break;
            }
        });  
    }

    const parseGalleryBoxCaption = (childNodes: NodeListOf<ChildNode> | undefined): string => {
        if (!childNodes) return '';

        let caption = '';
        childNodes.forEach((child: ChildNode) => {
            switch (child.nodeName) {
                case 'DIV':
                    break; // We want to ignore the "magnify" button in the caption
                case '#text':
                    caption += child.nodeValue;
                    break;
                default:
                    caption += (child as Element).outerHTML;
                    break;
            }
        });
        return caption;
    }

    const getImageFileUri = (imageElement: Element | null | undefined) => {
        // Example: /images/thumb/d/d4/Bear_Creek_Canyon_pic01.jpg/135px-Bear_Creek_Canyon_pic01.jpg
        const thumbnailFileUri: string | undefined = imageElement?.attributes
            .getNamedItem('src')
            ?.value;

        // Remove the "thumb" and last path item to get the original file uri
        return thumbnailFileUri
            ?.split('/')
            ?.filter(pathItem => pathItem !== 'thumb')
            ?.slice(0,-1)
            ?.join('/');
    }

    const parseGalleryBoxImage = (element: Element) => {
        const imageParent = element.querySelector('.thumbinner');
        const captionParent = element.querySelector('.thumbcaption');

        // Example: /File:Bear_Creek_Canyon_pic01.jpg
        const linkUri: string | undefined = imageParent
            ?.children[0]
            ?.attributes
            .getNamedItem('href')
            ?.value;

        const imageElement = imageParent
            ?.children[0]
            ?.children[0];

        const fileUri = getImageFileUri(imageElement);

        const caption = parseGalleryBoxCaption(captionParent?.childNodes);
            
        images.push({
            betaSectionTitle: currentBeta?.title,
            linkUrl: linkUri ? 'https://ropewiki.com' + linkUri : undefined,
            fileUrl: fileUri ? 'https://ropewiki.com' + fileUri : undefined,
            caption,
        });
    }

    const parseBannerImage = () => {
        const bannerImage: Element | null | undefined = document.querySelector('.tablecanyon')
            ?.querySelector('img');
        const bannerAnchor: Element | null | undefined = bannerImage?.parentElement;

        const linkUri = bannerAnchor?.attributes
            .getNamedItem('href')
            ?.value;

        const fileUri = getImageFileUri(bannerImage);

        images.push({
            betaSectionTitle: undefined,
            linkUrl: linkUri ? 'https://ropewiki.com' + linkUri : undefined,
            fileUrl: fileUri ? 'https://ropewiki.com' + fileUri : undefined,
            caption: undefined,
        });
    }

    const beta: any[] = [];
    const images: any[] = [];

    const parent: Element | null = document.querySelector('.mw-parser-output');
    if (parent === null) return { beta, images };

    parseBannerImage();
    parseChildNodes(parent.childNodes);
    if (currentBeta) beta.push(currentBeta);
    

    return { beta, images };
}

const parseRopewikiPage = async (html: string) => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    const { beta, images } = await page.evaluate(evalPage);

    await browser.close();

    return { beta, images };
}

export default parseRopewikiPage;