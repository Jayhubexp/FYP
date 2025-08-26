#!/usr/bin/env python3
#!/usr/bin/env python3
import json
import os
import runpy

# Change to project root so relative paths inside server.py resolve
project_root = os.path.dirname(__file__) + os.sep + '..'
os.chdir(project_root)

module_globals = runpy.run_path(os.path.join('api', 'server.py'), run_name='api_server_module')

find_verses_for_text = module_globals.get('find_verses_for_text')

def pretty(obj):
    print(json.dumps(obj, indent=2, ensure_ascii=False))

print('Testing find_verses_for_text("John 3:16")')
res = find_verses_for_text('John 3:16')
pretty(res)

print('\nTesting find_verses_for_text("loved the world")')
res2 = find_verses_for_text('loved the world')
pretty(res2)



    


    



    
















    


