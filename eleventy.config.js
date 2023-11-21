require('dotenv').config()

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
]

const dataFromCMS = query =>
	fetch(process.env.CMS_ENDPOINT, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ query }),
	})
		.then(response => response.json())
		.then(json => json.data)

module.exports = function (config) {
	config.addPassthroughCopy('images')
	config.addPassthroughCopy('styles')
	config.addPassthroughCopy('src/site.webmanifest')
	config.addPassthroughCopy('src/favicon.ico')

	config.addFilter('day', dateString => new Date(dateString).getUTCDate())
	config.addFilter(
		'month',
		dateString => months[new Date(dateString).getUTCMonth()]
	)
	config.addFilter('year', dateString => new Date(dateString).getUTCFullYear())
	config.addFilter('monthYear', dateString => {
		const date = new Date(dateString)
		return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
	})
	config.addFilter('date', dateString => {
		const date = new Date(dateString)
		return `${
			months[date.getUTCMonth()]
		} ${date.getUTCDate()}, ${date.getUTCFullYear()}`
	})
	config.addFilter('squeezeTag', content =>
		/^<([a-zA-Z]+)>.*<\/\1>$/.test(content)
			? content.replace(/^<[a-zA-Z]+>|<\/[a-zA-Z]+>$/g, '')
			: content
	)
	config.addFilter('squeezeParagraphTag', content =>
		/^<[pP]>.*<\/[pP]>$/.test(content)
			? content.replace(/^<[pP]>|<\/[pP]>$/g, '')
			: content
	)
	config.addFilter('multilineHtml', content => content.replace('\n', '<br>'))

	config.addGlobalData(
		'cms',
		dataFromCMS(`query {
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
			socialMedias(orderBy: priority_ASC) {
				name
				priority
				url
				icon {
					url
				}
			}
			events(orderBy: date_DESC) {
				date
				title
				topic
				details {
					html
					text
				}
				slug
			}
			papers(orderBy: date_DESC, first:100) {
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
			people(orderBy: role_ASC, first:100) {
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
			policy(where: {id: "clnfo8kqodbgx0blpxqd6uo7s"}) {
				details {
					html
					text
				}
				effectiveDate
			}
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
			links {
				name
				url
			}
		}`)
	)

	return { dir: { input: 'src' } }
}
