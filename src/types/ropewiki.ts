class RopewikiPageInfo {
    pageid: string
    name: string
    coordinates: { lat: number, lon: number } | undefined
    region: string
    quality: number | undefined
    rating: string | undefined
    timeRating: string | undefined
    kmlUrl: string | undefined
    technicalRating: string | undefined
    waterRating: string | undefined
    riskRating: string | undefined
    permits: string | undefined
    rappelCount: string | undefined
    rappelLongest: { value: number, unit: string } | undefined
    months: string[]
    shuttle: { value: number, unit: string } | undefined
    vehicle: string | undefined
    minTime: { value: number, unit: string } | undefined
    maxTime: { value: number, unit: string } | undefined
    hike: { value: number, unit: string } | undefined
    url: string
    isValid: boolean
    
    // `raw` is one element from the API `printouts` array
    constructor(raw: any) {
        // Check if required fields are present
        const pageid = raw.pageid?.[0];
        const name = raw.name?.[0];
        const region = raw.region?.[0]?.fulltext;
        const url = raw.url?.[0];

        // Set isValid based on whether all required fields are present
        this.isValid = !!(pageid && name && region && url);

        // Required scalar fields - set to empty strings if missing
        this.pageid = pageid ? String(pageid) : '';
        this.name = name ? String(name) : '';
        this.region = region ? String(region) : '';
        this.url = url ? String(url) : '';

        // Optional simple scalars
        this.quality = Array.isArray(raw.quality) && raw.quality.length > 0
            ? Number(raw.quality[0])
            : undefined;

        this.rating = Array.isArray(raw.rating) && raw.rating.length > 0
            ? String(raw.rating[0])
            : undefined;

        this.timeRating = Array.isArray(raw.timeRating) && raw.timeRating.length > 0
            ? String(raw.timeRating[0])
            : undefined;

        this.kmlUrl = Array.isArray(raw.kmlUrl) && raw.kmlUrl.length > 0
            ? String(raw.kmlUrl[0])
            : undefined;

        this.technicalRating = Array.isArray(raw.technicalRating) && raw.technicalRating.length > 0
            ? String(raw.technicalRating[0])
            : undefined;

        this.waterRating = Array.isArray(raw.waterRating) && raw.waterRating.length > 0
            ? String(raw.waterRating[0])
            : undefined;

        this.riskRating = Array.isArray(raw.riskRating) && raw.riskRating.length > 0
            ? String(raw.riskRating[0])
            : undefined;

        this.permits = Array.isArray(raw.permits) && raw.permits.length > 0
            ? String(raw.permits[0])
            : undefined;

        this.rappelCount = Array.isArray(raw.rappelCount) && raw.rappelCount.length > 0
            ? String(raw.rappelCount[0])
            : undefined;

        this.vehicle = Array.isArray(raw.vehicle) && raw.vehicle.length > 0
            ? String(raw.vehicle[0])
            : undefined;

        // Optional object-valued fields (value/unit pairs)
        this.coordinates = Array.isArray(raw.coordinates) && raw.coordinates.length > 0
            ? {
                lat: Number(raw.coordinates[0].lat),
                lon: Number(raw.coordinates[0].lon),
            }
            : undefined;

        this.rappelLongest = Array.isArray(raw.rappelLongest) && raw.rappelLongest.length > 0
            ? {
                value: Number(raw.rappelLongest[0].value),
                unit: String(raw.rappelLongest[0].unit),
            }
            : undefined;

        this.shuttle = Array.isArray(raw.shuttle) && raw.shuttle.length > 0
            ? {
                value: Number(raw.shuttle[0].value),
                unit: String(raw.shuttle[0].unit),
            }
            : undefined;

        this.minTime = Array.isArray(raw.minTime) && raw.minTime.length > 0
            ? {
                value: Number(raw.minTime[0].value),
                unit: String(raw.minTime[0].unit),
            }
            : undefined;

        this.maxTime = Array.isArray(raw.maxTime) && raw.maxTime.length > 0
            ? {
                value: Number(raw.maxTime[0].value),
                unit: String(raw.maxTime[0].unit),
            }
            : undefined;

        this.hike = Array.isArray(raw.hike) && raw.hike.length > 0
            ? {
                value: Number(raw.hike[0].value),
                unit: String(raw.hike[0].unit),
            }
            : undefined;

        // Months is always an array of strings; fall back to []
        this.months = Array.isArray(raw.months)
            ? raw.months.map((m: unknown) => String(m))
            : [];
    }
}

export default RopewikiPageInfo;