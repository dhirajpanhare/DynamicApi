# Config package
# Use PyMySQL as MySQL database driver if mysqlclient is not available
try:
    import MySQLdb
except ImportError:
    import pymysql
    pymysql.install_as_MySQLdb()
