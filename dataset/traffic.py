from app import app


@app.route('/data/traffic')
def get_traffic_data():
    traffic_csv = './sta_siouxfalls/modified_coords.csv'




if __name__ == '__main__':
    app.run(debug=True)