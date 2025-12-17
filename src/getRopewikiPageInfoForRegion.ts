import RopewikiPageInfo from './types/ropewiki';

const apiRequestPrintouts = {
    pageid: 'Has pageid',
    name: 'Has name',
    coordinates: 'Has coordinates',
    region: 'Located in region',
    quality: 'Has user rating',
    rating: 'Has rating',
    timeRating: 'Has time rating',
    kmlUrl: 'Has KML file',
    technicalRating: 'Has technical rating',
    waterRating: 'Has water rating',
    riskRating: 'Has extra risk rating',
    permits: 'Requires permits',
    rappelCount: 'Has info rappels',
    rappelLongest: 'Has longest rappel',
    months: 'Has best month',
    shuttle: 'Has shuttle length',
    vehicle: 'Has vehicle type',
    minTime: 'Has fastest typical time',
    maxTime: 'Has slowest typical time',
    hike: 'Has length of hike',
    url: 'Has url',
};

const encode = (input: string) => {
    return encodeURIComponent(input).replace(/%/g, '-');
}

const getRopewikiPageInfoForRegion = async (region: string, offset: number, limit: number): Promise<RopewikiPageInfo[]> => {
    try {
        const url = new URL('https://ropewiki.com/index.php');
        url.searchParams.append('title', 'Special:Ask');

        const propertiesEncoded = Object.entries(apiRequestPrintouts)
            .map(([a, b]) => `${encode(b)}=${encode(a)}`)
            .join('/-3F');

        url.searchParams.append(
            'x',
            `-5B-5BCategory:Canyons-5D-5D-5B-5BCategory:Canyons-5D-5D-5B-5BLocated-20in-20region.Located-20in-20regions::X-7C-7C${region}-5D-5D/-3F${propertiesEncoded}`,
        );
        url.searchParams.append('format', 'json');
        url.searchParams.append('limit', limit.toString());
        url.searchParams.append('offset', offset.toString());

        const response = await fetch(url);

        if (response.ok) {
            const body = await response.json();

            return Object.values(body.results).map((result: unknown) => new RopewikiPageInfo(result));
        } else {
            throw new Error(`Error getting pages info for region ${region} offset ${offset} limit ${limit}: ${response.status} ${response.statusText}`);
        }
    } catch (error) {
        throw new Error(`Error getting pages info for region ${region} offset ${offset} limit ${limit}: ${error}`);
    }
}

export default getRopewikiPageInfoForRegion;