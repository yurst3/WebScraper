import puppeteer from 'puppeteer';

/*
HTML elements look something like this:

<ul class="collapsibleList optionform regioncount notranslate">
    <ul>
        <li>
            <a href="/World" title="World">World</a>
            <ul>
                <li>
                    <a href="/Africa" title="Africa">Africa</a>
                    <ul>...</ul>
                </li>
                <li>...</li>
                <li>...</li>
                <li>...</li>
                <li>...</li>
                <li>...</li>
                <li>...</li>
                <li>...</li>
            </ul>
        </li>
    </ul>
</ul>
*/
const evalPage = () => {
    // parseRegion() has to be defined inside evalPage() because it is being run in a browser context and can't reference other functions
    const parseRegion = (
        unorderedListElement: ChildNode,
        regions: { name: string | null | undefined, parent: string | null | undefined }[],
        parent: string | null | undefined
    ) => {
        const listItems = unorderedListElement.childNodes;
        listItems.forEach((node: ChildNode) => {
            if (node.nodeName !== '#text') { // I'm not quite sure why these #text child nodes are being included, let's just ignore them
                const name = node.childNodes[0]?.textContent;
                const unorderedListElement: ChildNode | undefined = node.childNodes[2];
        
                regions.push({ name, parent });
                if (unorderedListElement) parseRegion(unorderedListElement, regions, name);
            }
        });
    }

    const regions: { name: string | null | undefined, parent: string | null | undefined }[] = [];
    const unorderedListElement: ChildNode | undefined = document.querySelector('.collapsibleList')?.childNodes[1];
    if (unorderedListElement) parseRegion(unorderedListElement, regions, undefined);
    return regions;
}

// Use puppeteer headless browser to help parse the regions from https://ropewiki.com/Regions html. 
const parseRegionsHtml = async (html: string): Promise<{ name: string | null | undefined, parent: string | null | undefined }[]> => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(html);

    const regions = await page.evaluate(evalPage);

    await browser.close();
    return regions;
}

export default parseRegionsHtml;