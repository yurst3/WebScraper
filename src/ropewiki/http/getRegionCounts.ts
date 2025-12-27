import chunk from 'lodash/chunk';

/*
This is more like a "soft limit", I think if the URI is too long it will default to returning a single count for all regions.
Depending on which set of names you get, it could be as much as 75-80 regions. 38 is highest number that will fetch the set of all regions successfully.
30 will give us a good buffer in case there is a weird set of regions with extra long names.
*/
const API_REGION_LIMIT = 30;
/*
Example response: (144);(290);(709);(5977);(135);(3498);(794);(117)
*/
const REGEX = /\((\d+)\)/g;

const getRegionCounts = async (regionNames: string[]): Promise<{[name: string]: number}> => {
    const regionNameChunks: string[][] = chunk(regionNames, API_REGION_LIMIT);
    const regionNameCounts: {[name: string]: number} = {};

    for (const nameChunk of regionNameChunks) {
        const regionString = nameChunk.map(name => encodeURIComponent(name)).join('%3B');
        const url = `https://ropewiki.com/index.php?title=Template:RegionCount&action=raw&templates=expand&ctype=text/x-wiki&region=${regionString}`;

        try {
            const response = await fetch(url);
    
            if (response.ok) {
                const body = await response.text();

                const counts = Array.from(body.matchAll(REGEX))
                    .map(match => match[1])
                    .filter((num): num is string => num !== undefined)
                    .map(num => parseInt(num, 10));

                if (nameChunk.length !== counts.length) throw new Error(`Error getting region counts: Expected ${nameChunk.length} region counts but got ${counts.length}`);
                nameChunk.forEach((name, index) => regionNameCounts[name] = counts[index] as number);
            } else {
                throw new Error(`Error getting region counts: ${response.status} ${response.statusText}`);
            }
    
        } catch (error) {
            throw new Error(`Error getting region counts: ${error}`);
        }
    }

    return regionNameCounts;
}

export default getRegionCounts;