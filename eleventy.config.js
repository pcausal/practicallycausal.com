require('dotenv').config();

const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

const dataFromCMS = async (query, maxRetries = 5) => {
    const baseDelayMs = 1000; // Start with 1 second (as recommended by Hygraph)
    const maxDelayMs = 5000; // Cap at 5 seconds

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            const response = await fetch(process.env.CMS_ENDPOINT, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query }),
            });

            const json = await response.json();

            // Check for concurrent operations limit error (HTTP 429 or GraphQL error)
            const isConcurrencyError =
                response.status === 429 ||
                (json.errors &&
                    json.errors.some(
                        (e) =>
                            e.message &&
                            e.message
                                .toLowerCase()
                                .includes(
                                    'concurrent operations limit exceeded'
                                )
                    ));

            if (isConcurrencyError && attempt < maxRetries) {
                // Exponential backoff: 1s, 2s, 4s, 5s, 5s...
                const delay = Math.min(
                    baseDelayMs * Math.pow(2, attempt),
                    maxDelayMs
                );
                console.log(
                    `⚠️  Concurrent operations limit hit. Retrying in ${delay}ms (attempt ${
                        attempt + 1
                    }/${maxRetries + 1})...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }

            if (!response.ok || json.errors || !json.data) {
                console.error(
                    'CMS response error:',
                    JSON.stringify(
                        {
                            status: response.status,
                            statusText: response.statusText,
                            errors: json.errors,
                            dataPresent: !!json.data,
                        },
                        null,
                        2
                    )
                );
                if (attempt < maxRetries && !isConcurrencyError) {
                    // Retry for other errors too, but with backoff
                    const delay = Math.min(
                        baseDelayMs * Math.pow(2, attempt),
                        maxDelayMs
                    );
                    console.log(
                        `⚠️  Retrying in ${delay}ms (attempt ${attempt + 1}/${
                            maxRetries + 1
                        })...`
                    );
                    await new Promise((resolve) => setTimeout(resolve, delay));
                    continue;
                }
            }

            return json.data;
        } catch (error) {
            if (attempt < maxRetries) {
                const delay = Math.min(
                    baseDelayMs * Math.pow(2, attempt),
                    maxDelayMs
                );
                console.log(
                    `⚠️  Network error. Retrying in ${delay}ms (attempt ${
                        attempt + 1
                    }/${maxRetries + 1})...`
                );
                await new Promise((resolve) => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }

    throw new Error('Failed to fetch CMS data after all retries');
};

const fetchPeopleFromCMS = async () => {
    const pageSize = 100;
    const people = [];

    while (true) {
        const skip = people.length;
        console.log(`  → Fetching people ${skip + 1}-${skip + pageSize}...`);
        const data = await dataFromCMS(`query {
					people(orderBy: role_ASC, first:${pageSize}, skip:${skip}) {
						name
						slug
						photo {
							url
						}
						title
						school
						role
						homepage
						biography {
							html
							text
						}
					}
				}`);
        const page = data?.people || [];

        people.push(...page);

        if (page.length < pageSize) {
            return people;
        }
    }
};

module.exports = function (config) {
    config.addPassthroughCopy('images');
    config.addPassthroughCopy('styles');
    config.addPassthroughCopy('src/site.webmanifest');
    config.addPassthroughCopy('src/favicon.ico');

    config.addFilter('day', (dateString) => new Date(dateString).getUTCDate());
    config.addFilter(
        'month',
        (dateString) => months[new Date(dateString).getUTCMonth()]
    );
    config.addFilter('year', (dateString) =>
        new Date(dateString).getUTCFullYear()
    );
    config.addFilter('monthYear', (dateString) => {
        const date = new Date(dateString);
        return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
    });
    config.addFilter('date', (dateString) => {
        const date = new Date(dateString);
        return `${
            months[date.getUTCMonth()]
        } ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
    });
    config.addFilter('squeezeTag', (content) =>
        /^<([a-zA-Z]+)>.*<\/\1>$/.test(content)
            ? content.replace(/^<[a-zA-Z]+>|<\/[a-zA-Z]+>$/g, '')
            : content
    );
    config.addFilter('squeezeParagraphTag', (content) =>
        /^<[pP]>.*<\/[pP]>$/.test(content)
            ? content.replace(/^<[pP]>|<\/[pP]>$/g, '')
            : content
    );
    config.addFilter('multilineHtml', (content) =>
        content ? content.replace('\n', '<br>') : ''
    );

    config.addGlobalData('cms', async () => {
        console.log('Fetching CMS data in batches...');
        try {
            // Batch 1: Core site info (basic + website)
            console.log('  → Fetching basic + website...');
            const batch1 = await dataFromCMS(`query {
					basic(where: {id: "clnctyp51hrrk0bmz4xfaxc5r"}) {
						name
						longName
						shortIntro {
							text
							html
						}
						logo {
							url
						}
						email
						address
						whatWeDo {
							text
							html
						}
						whoWeAre {
							text
							html
						}
						publications {
							text
							html
						}
						joinUs {
							html
							text
						}
						events {
							text
							html
						}
					}
					website(where: {id: "clncxqdc8iccb0bk92yv12dm8"}) {
						navigationBar {
							name
							links {
								name
								slug
							}
							slug
						}
						bigMailIcon {
							url
						}
						bigMapIcon {
							url
						}
						coursesIcon {
							url
						}
						downIcon {
							url
						}
						emailIcon {
							url
						}
						gitHubIcon {
							url
						}
						homeHeaderBackground {
							url
						}
						opportunitiesImage {
							url
						}
						resourcesIcon {
							url
						}
						softwareIcon {
							url
						}
						title
						xIcon {
							url
						}
						youTubeIcon {
							url
						}
					}
				}`);

            // Batch 2: Social media
            console.log('  → Fetching social media...');
            const batch2 = await dataFromCMS(`query {
					socialMedias(orderBy: priority_ASC) {
						name
						priority
						url
						icon {
							url
						}
					}
				}`);

            // Batch 3: Events
            console.log('  → Fetching events...');
            const batch3 = await dataFromCMS(`query {
					events(orderBy: date_DESC, first: 1000) {
						date
						title
						topic
						details {
							html
							text
						}
						hosts {
							name
							title
							school
							homepage
						}
						slug
					}
				}`);

            // Batch 4: Papers
            console.log('  → Fetching papers...');
            const batch4 = await dataFromCMS(`query {
					papers(orderBy: date_DESC, first:1000) {
						date
						title
						slug
						abstract {
							html
							text
						}
						authors {
							name
							homepage
						}
						url
						links {
							name
							url
						}
						softwares {
							name
							url
							slug
						}
						publication {
							name
							url
						}
					}
				}`);

            // Batch 5: People
            const people = await fetchPeopleFromCMS();

            // Batch 6: Policy
            console.log('  → Fetching policy...');
            const batch6 = await dataFromCMS(`query {
					policy(where: {id: "clnfo8kqodbgx0blpxqd6uo7s"}) {
						details {
							html
							text
						}
						effectiveDate
					}
				}`);

            // Batch 7: Softwares
            console.log('  → Fetching softwares...');
            const batch7 = await dataFromCMS(`query {
					softwares {
						name
						slug
						url
						description {
							html
							text
						}
						papers {
							title
							slug
						}
					}
				}`);

            // Batch 8: Links
            console.log('  → Fetching links...');
            const batch8 = await dataFromCMS(`query {
					links {
						name
						url
					}
				}`);

            // Batch 9: Projects
            console.log('  → Fetching projects...');
            const batch9 = await dataFromCMS(`query {
					projects(first:100) {
						date
						description {
							html
							text
						}
						image {
							url
						}
						links {
							url
							name
						}
						slug
						softwares {
							name
							url
						}
						collaborators {
							name
							homepage
						}
						title
						url
					}
				}`);

            // Batch 10: Learning resources
            console.log('  → Fetching learning resources...');
            const batch10 = await dataFromCMS(`query {
					learningResourceCategories {
						name
						slug
						learningResources {
							title
							slug
							lastUpdate
							level
							description {
								html
								text
							}
							url
							authors {
								name
								homepage
							}
						}
					}
				}`);

            // Combine all batches
            const cmsData = {
                basic: batch1?.basic || {},
                website: batch1?.website || {},
                socialMedias: batch2?.socialMedias || [],
                events: batch3?.events || [],
                papers: batch4?.papers || [],
                people,
                policy: batch6?.policy || {},
                softwares: batch7?.softwares || [],
                links: batch8?.links || [],
                projects: batch9?.projects || [],
                learningResourceCategories:
                    batch10?.learningResourceCategories || [],
            };

            console.log('✅ CMS data fetched successfully (all batches)');
            return cmsData;
        } catch (error) {
            console.error('Error fetching CMS data:', error.message);
            return {
                basic: {},
                website: {},
                socialMedias: [],
                events: [],
                papers: [],
                people: [],
                policy: {},
                softwares: [],
                links: [],
                projects: [],
                learningResourceCategories: [],
            };
        }
    });

    return { dir: { input: 'src' } };
};
