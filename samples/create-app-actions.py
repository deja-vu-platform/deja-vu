import os

APP_NAME = 'phoenix'
DIRECTORY = './'+ APP_NAME + '/src/'

app_actions = [
  'show-connection'
]

for action in app_actions:
  os.makedirs(DIRECTORY + action)

  filename_without_ext = DIRECTORY + action + '/' + action

  html_string = '<dv.action name="' + action + '">\n\n'
  html_string += '</dv.action>'

  html_file = open(filename_without_ext + '.html', 'w')
  html_file.write(html_string)
  html_file.close()

  css_file = open(filename_without_ext + '.css', 'w')
  css_file.write('')
  css_file.close()
