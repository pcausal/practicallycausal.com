require('dotenv').config()

const months = [
	'',
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
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

	config.addFilter('day', dateString => new Date(dateString).getUTCDay())
	config.addFilter(
		'month',
		dateString => months[new Date(dateString).getUTCMonth()]
	)
	config.addFilter('year', dateString => new Date(dateString).getUTCFullYear())
	config.addFilter('monthYear', dateString => {
		const date = new Date(dateString)
		return `${months[date.getUTCMonth()]} ${date.getUTCFullYear()}`
	})
	config.addFilter('squeezeTag', content =>
		/^<([a-zA-Z]+)>.*<\/\1>$/.test(content)
			? content.replace(/^<[a-zA-Z]+>|<\/[a-zA-Z]+>$/g, '')
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
			}
			website(where: {id: "clncxqdc8iccb0bk92yv12dm8"}) {
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
			publications(orderBy: date_DESC) {
				date
				title
				abstract {
					html
					text
				}
			}
			people(orderBy: role_ASC) {
				name
				slug
				photo {
					url
				}
				title
				school
				role
			}
		}`)
	)

	return { dir: { input: 'src' } }
}
