from flask import Flask, request, render_template, send_from_directory, abort, jsonify
import os
import json

app = Flask(__name__)

@app.route('/')
@app.route('/home')
def home():
    return render_template('index.html')

@app.route('/api/getChat', methods=['GET'])
def getChat():
    chatNum = request.args.get('chatNum')
    chatMessageRange = request.args.get('chatMessageRange')

    if not chatNum:
        return {"error": "chatNum query parameter required"}, 400

    filename = f"chat{chatNum}.json"
    chat_dir = os.path.join(app.root_path, 'static', 'chats')
    filepath = os.path.join(chat_dir, filename)

    if not os.path.exists(filepath):
        return {"error": "chat not found"}, 404

    return send_from_directory(chat_dir, filename, mimetype='application/json')
    
@app.route('/api/getChatList', methods=['GET'])
def getChatList():
    chat_dir = os.path.join(app.root_path, 'static', 'chats')
    list_path = os.path.join(chat_dir, 'chatlist.json')
    if not os.path.exists(list_path):
        return {"error": "chat list not found"}, 404

    try:
        with open(list_path, 'r', encoding='utf-8') as f:
            chat_list = json.load(f)
    except Exception:
        return {"error": "invalid chat list"}, 500

    for entry in chat_list:
        cid = entry.get('id')
        if cid is None:
            continue
        chat_file = os.path.join(chat_dir, f'chat{cid}.json')
        if not os.path.exists(chat_file):
            continue
        try:
            with open(chat_file, 'r', encoding='utf-8') as cf:
                data = json.load(cf)
            msgs = data.get('messages') or []
            last = None
            for m in reversed(msgs):
                if m and m.get('text'):
                    last = m
                    break
            if last:
                entry['lastMessage'] = last.get('text')
                entry['lastTime'] = last.get('time')
        except Exception:
            continue

    return jsonify(chat_list)
    
@app.route('/favicon.ico')
def favicon():
   return send_from_directory(os.path.join(app.root_path, 'static'),
                          'favicon.ico',mimetype='image/vnd.microsoft.icon')
if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=False)
