'use strict'

const sudo = require('sudo-prompt')
const util = require('util')
const parseXml = require('xml2js').parseString
const os = require('os')

const mapping = {
  schedule: '/SC',
  modifier: '/MO',
  days: '/D',
  months: '/M',
  idletime: '/I',
  taskname: '/TN',
  taskrun: '/TR',
  starttime: '/ST',
  interval: '/RI',
  endtime: '/ET',
  duration: '/DU',
  startdate: '/SD',
  enddate: '/ED',
  level: '/RL',
  enable: '/ENABLE',
  disable: '/DISABLE'
}

/**
 * Returns user name that will be used for the task.
 *
 * If null or false is passed, SYSTEM user is be returned.
 * If true is returned, current logged user is returned.
 * Or given string value is returned.
 *
 * @param {string|boolean|null} value
 * @return {string}
 */
function getUser (value) {
  if (value === null || value === false) {
    return 'SYSTEM'
  } else if (value === true) {
        return os.userInfo().username
  }
  return value
}

function mapFields (cmd) {
  return Object.keys(cmd).reduce((mapped, key) => {
    let opt = mapping[key]

    if (opt) {
      let val = cmd[key]

      if (val instanceof Array)
        val = val.join(',')

      mapped.push(val ? `${opt} ${val}` : opt)
    }

    return mapped
  }, [])
}

function exec () {
  const sudo_exec = util.promisify(sudo.exec)

  return sudo_exec(...arguments)
}

exports.create = function (task, cmd, user = null) {
  cmd['taskname'] = `"${task}"`

  let fields = mapFields(cmd)

  fields.unshift(...[
    'schtasks',
    '/Create' 
  ])

  fields.push(...[
    '/RU ' + getUser(user),
    '/F'  
  ])

  return exec(fields.join(' '), { name: task })
}

exports.get = async function (task) {
  let fields = mapFields({ taskname: `"${task}"` })

  fields.unshift(...[
    'schtasks',
    '/Query'  
  ])

  fields.push('/XML')

  const xml = await exec(fields.join(' '), { name: task })

  const parser = util.promisify(parseXml)

  return parser(xml, {
    trim: true,
    normalize: true,
    explicitRoot: false,
    explicitArray: false,
    ignoreAttrs: true,
    preserveChildrenOrder: true
  })
}

exports.destroy = function (task) {
  let fields = mapFields({ taskname: `"${task}"` })

  fields.unshift(...[
    'schtasks',
    '/Delete' 
  ])

  fields.push('/F')

  return exec(fields.join(' '), { name: task })
}

exports.run = function (task) {
  let fields = mapFields({ taskname: `"${task}"` })

  fields.unshift(...[
    'schtasks',
    '/Run'  
  ])

  return exec(fields.join(' '), { name: task })
}

exports.stop = function (task) {
  let fields = mapFields({ taskname: `"${task}"` })

  fields.unshift(...[
    'schtasks',
    '/End'  
  ])

  return exec(fields.join(' '), { name: task })
}

exports.update = function (task, cmd, user = null) {
  cmd['taskname'] = `"${task}"`

  let fields = mapFields(cmd)

  fields.unshift(...[
    'schtasks',
    '/Change' 
  ])

  fields.push('/RU ' + getUser(user))

  return exec(fields.join(' '), { name: task })
}
exports.getUser = getUser
