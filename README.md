# confluence-outdated - Constant validation of Confluence document outdates

[![Docker](https://github.com/dodevops/confluence-outdated/actions/workflows/docker-publish.yml/badge.svg)](https://github.com/dodevops/confluence-outdated/actions/workflows/docker-publish.yml)

## Introduction

_confluence-outdated_ searches a Confluence space for documents that haven't been updated for a specified time and
notifies the author of the last version of each document or a separate page maintainer.

## Usage

_confluence-outdated_ can be used with Docker to quickly run it without any further dependencies.

    docker run --rm -it ghcr.io/dodevops/confluence-outdated:main <arguments> 

## Configuration Document

_confluence-outdated_ needs several things configured before it can start working. To simplify this, 
_confluence-outdated_ reads its configuration from a Confluence document.

The structure of this document is based on Panels and tables. To ease the creation of this document,
_confluence-outdated_ includes a command to create a template document:

    confluence-outdated CreateConfigurationDocument --url <Confluence base URL> --user <Username> --password <Password> --space <Key of space that should hold the document> --title <Title for the configuration document> --parentId <Page ID that the configuration document is place under>

Example:

    confluence-outdated CreateConfigurationDocument --url https://example.com/confluence --user somebody --password secret --space CM --title "My configuration document" --parentId 12345

The command will output the page ID for the configuration document and a link to it.

The configuration is based on several panels. The configuration for the different panels is as follows:

### Panel "Configuration"

- Space: The key of the space where _confluence-outdated_ should check for outdated documents
- Domain: A default domain, that will be appended to all author usernames (should be set if the usernames aren't email addresses themselves)
- NotificationFrom: <The address used as the sender in the notification mails

### Panel "Checks"

A table of checks that will be carried out.

- Labels: A list of all labels (separated by ,) that a checked document has to match
- MaxAge: The maximum age of a checked document. If a document was modified before that, a notification is send

### Panel "Maintainer"

A table of maintainers for pages.

- PagePattern: A regular expression that is matched against the full document path. Parent pages are separated through a "/".
- Maintainer: The users that should receive all notifications for pages matching this pattern (separated by ,). You can 
  use `_lastauthor` to reference the last author of the page) 

### Panel "Exceptions"

A list of regular expressions that are matched against all document paths. If a pattern matches, that document will be
excluded from notifications.

### Panel "Notification Template"

This panel includes two child panels which hold [Handlebars](https://handlebarsjs.com/guide/) templates for the
subject and the body of the notification mails.

They will get [this object](https://github.com/dodevops/confluence-outdated/blob/master/lib/api/DocumentInfo.ts#L6) as
a context for the template.

## Usage

After the configuration document is properly setup, run *confluence-outdated* on a regular basis:

    confluence-outdated Check --url https://example.com/confluence --user somebody --password secret -i 123456 -s "smtp://localhost:25/?ignoreTLS=true"

This will fetch the confluence document with the id 123456 as the configuration and check all required documentation as
configured. The SMTP url is based on the [nodemailer smtp transport](https://nodemailer.com/smtp/).

## Development

The tests subdirectory contain unit tests run by mocha for all parts of the api. If you want to help developing, please
follow the following workflow:

- Create an issue describing the bug or feature
- For this repository
- Create a branch named "issue-<issue number>"
- Write a test that tests the feature or bug
- Run the test => the new test should fail
- Write or fix the code for the change
- Run the test again => the new test should succeed
- Push and create a pull request

To test and build this package, simply use grunt:

    grunt test
