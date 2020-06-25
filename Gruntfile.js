module.exports = function (grunt) {
  grunt.initConfig({
    eslint: {
      files: {
        src: ['index.ts', 'lib/**/*.ts', 'test/**/*.ts', '!index.d.ts', '!lib/**/*.d.ts', '!test/**/*.d.ts'],
      },
    },
    clean: {
      coverage: ['test/coverage'],
    },
    ts: {
      default: {
        tsconfig: true,
      },
    },
    copy: {
      test: {
        files: {
          'test/coverage/instrument/': ['test/**/*.js', 'resources/configurationDocument.html'],
        },
        options: {
          expand: true,
        },
      },
    },
    instrument: {
      files: ['index.js', 'lib/**/*.js'],
      options: {
        lazy: true,
        basePath: 'test/coverage/instrument/',
      },
    },
    mochaTest: {
      test: {
        options: {
          reporter: 'spec',
          quiet: false,
        },
        src: ['test/coverage/instrument/test/**/*.js'],
      },
    },
    storeCoverage: {
      options: {
        dir: 'test/coverage/reports',
      },
    },
    remapIstanbul: {
      build: {
        src: 'test/coverage/reports/coverage.json',
        options: {
          reports: {
            json: 'test/coverage/reports/coverage-mapped.json',
          },
        },
      },
    },
    makeReport: {
      src: 'test/coverage/reports/coverage-mapped.json',
      options: {
        type: 'lcov',
        dir: 'test/coverage/reports',
        print: 'detail',
      },
    },
  })

  grunt.loadNpmTasks('grunt-ts')
  grunt.loadNpmTasks('grunt-eslint')
  grunt.loadNpmTasks('grunt-mocha-test')
  grunt.loadNpmTasks('grunt-istanbul')
  grunt.loadNpmTasks('remap-istanbul')
  grunt.loadNpmTasks('grunt-contrib-clean')
  grunt.loadNpmTasks('grunt-contrib-copy')

  grunt.registerTask('build', ['eslint', 'ts'])

  grunt.registerTask('default', ['build'])

  grunt.registerTask('test', [
    'build',
    'clean:coverage',
    'copy:test',
    'instrument',
    'mochaTest:test',
    'storeCoverage',
    'remapIstanbul',
    'makeReport',
  ])

  grunt.registerTask('release', ['test'])
}
